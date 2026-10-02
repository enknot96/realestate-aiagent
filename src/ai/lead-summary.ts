import "server-only";
import { generateText, Output, type LanguageModel, type UIMessage } from "ai";
import { z } from "zod";
import { agentModel } from "@/ai/model";
import { buildConversationIndex } from "@/components/chat/conversation-index";
import { isToolPart } from "@/components/chat/types";

// 反響（問い合わせ）の要約。「事実はツール結果からコードで、推測はLLMに」の分担:
// - facts: 会話中のツール結果から決定的に抽出する（LLMは関与しない）
// - それ以外: 会話の文脈からLLMが読み取る（構造化出力）

export type LeadFacts = {
  viewedProperties: { id: number; title?: string; price?: number; type?: string }[];
  inquiry?: { inquiryId: number; propertyId: number; name?: string; email?: string; phone?: string };
  viewing?: { viewingId: number; scheduledAt: string; propertyId?: number };
};

const temperatureSchema = z.enum(["hot", "warm", "cold"]);
type Temperature = z.infer<typeof temperatureSchema>;

// LLMに任せる部分のスキーマ。値の意味はdescribeでモデルにも伝わる
const leadInsightSchema = z.object({
  intent: z.enum(["rent", "buy", "unknown"]).describe("賃貸(rent)・購入(buy)・不明(unknown)"),
  conditions: z.object({
    budgetMin: z.number().int().nullable().describe("予算下限（円の整数）。言及が無ければnull"),
    budgetMax: z.number().int().nullable().describe("予算上限（円の整数）。言及が無ければnull"),
    layouts: z.array(z.string()).describe("希望の間取り。言及が無ければ空配列"),
    areas: z.array(z.string()).describe("希望エリア。言及が無ければ空配列"),
    mustHaves: z.array(z.string()).describe("必須条件。言及が無ければ空配列"),
    niceToHaves: z.array(z.string()).describe("あれば嬉しい条件。言及が無ければ空配列"),
  }),
  moveInTiming: z.string().nullable().describe("入居・購入の希望時期。言及が無ければnull"),
  household: z.string().nullable().describe("家族構成・ペットなど。言及が無ければnull"),
  temperature: temperatureSchema.describe("見込み度。hot=すぐ動くべき / warm / cold"),
  temperatureReason: z.string().describe("温度感の根拠を1文で"),
  nextActions: z.array(z.string()).max(3).describe("営業が次にやること。最大3つ、具体的に"),
  summary: z.string().describe("3行以内の要約"),
});

export type LeadSummary = { facts: LeadFacts } & z.infer<typeof leadInsightSchema>;

export class NoUserMessageError extends Error {
  constructor() {
    super("ユーザーの発言が無い会話は要約できません");
    this.name = "NoUserMessageError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const optionalString = (value: unknown) => (typeof value === "string" ? value : undefined);

// 会話中のツール結果から事実を取り出す。{ error: ... } の出力は失敗なので無視する
export function extractLeadFacts(messages: UIMessage[]): LeadFacts {
  const index = buildConversationIndex(messages);
  const viewedIds: number[] = [];
  const facts: LeadFacts = { viewedProperties: [] };
  const inquiryPropertyIds = new Map<number, number>();

  const markViewed = (id: unknown) => {
    if (typeof id === "number" && !viewedIds.includes(id)) viewedIds.push(id);
  };

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolPart(part) || part.state !== "output-available") continue;
      const output = part.output;
      if (!isRecord(output) || "error" in output) continue;
      const input = part.input ?? {};

      switch (part.type) {
        case "tool-getPropertyDetail":
          markViewed(input.id);
          break;
        case "tool-checkViewingAvailability":
          markViewed(input.propertyId);
          break;
        case "tool-createInquiry":
          if (typeof input.propertyId === "number" && typeof output.inquiryId === "number") {
            markViewed(input.propertyId);
            inquiryPropertyIds.set(output.inquiryId, input.propertyId);
            facts.inquiry = {
              inquiryId: output.inquiryId,
              propertyId: input.propertyId,
              name: optionalString(input.name),
              email: optionalString(input.email),
              phone: optionalString(input.phone),
            };
          }
          break;
        case "tool-createViewing":
          if (typeof output.viewingId === "number" && typeof output.scheduledAt === "string") {
            facts.viewing = {
              viewingId: output.viewingId,
              scheduledAt: output.scheduledAt,
              propertyId:
                typeof input.inquiryId === "number"
                  ? inquiryPropertyIds.get(input.inquiryId)
                  : undefined,
            };
          }
          break;
      }
    }
  }

  facts.viewedProperties = viewedIds.map((id) => {
    const found = index.findProperty(id);
    return { id, title: found?.title, price: found?.price, type: found?.type };
  });
  return facts;
}

// LLMに渡す会話。ツールの生の出力は含めず、ユーザーとアシスタントの発言だけにする
function buildTranscript(messages: UIMessage[]): { text: string; hasUserText: boolean } {
  let hasUserText = false;
  const lines: string[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("")
      .trim();
    if (!text) continue;
    if (message.role === "user") hasUserText = true;
    lines.push(`${message.role === "user" ? "お客様" : "みらいくん"}: ${text}`);
  }
  return { text: lines.join("\n"), hasUserText };
}

const SYSTEM_PROMPT = [
  "あなたは不動産会社の営業アシスタントです。AIチャットとお客様の会話を読み、営業が引き継ぐための要約を作ります。",
  "- 会話に書かれていないことは null / 空配列にし、推測で埋めないこと",
  "- 金額は円の整数で表す（例: 8万円 → 80000、3,500万円 → 35000000）",
  "- nextActions は営業が次にやることを最大3つ、具体的に書く",
  "- summary は3行以内",
].join("\n");

// ルールによる温度感の補正。内見予約が成立していれば必ずhot、問い合わせ済みなら少なくともwarm
const RANK: Record<Temperature, number> = { cold: 0, warm: 1, hot: 2 };

export function adjustTemperature(
  insight: Pick<z.infer<typeof leadInsightSchema>, "temperature" | "temperatureReason">,
  facts: LeadFacts,
): { temperature: Temperature; temperatureReason: string } {
  const floor: { temperature: Temperature; reason: string } | undefined = facts.viewing
    ? { temperature: "hot", reason: "内見の予約が成立しているため" }
    : facts.inquiry
      ? { temperature: "warm", reason: "物件への問い合わせが済んでいるため" }
      : undefined;

  if (!floor || RANK[insight.temperature] >= RANK[floor.temperature]) {
    return { temperature: insight.temperature, temperatureReason: insight.temperatureReason };
  }
  return { temperature: floor.temperature, temperatureReason: floor.reason };
}

export async function summarizeLead({
  messages,
  model = agentModel,
}: {
  messages: UIMessage[];
  model?: LanguageModel;
}): Promise<LeadSummary> {
  const transcript = buildTranscript(messages);
  // ユーザー発言が無い会話は要約する材料が無いので、LLMを呼ばずに止める
  if (!transcript.hasUserText) {
    throw new NoUserMessageError();
  }

  const facts = extractLeadFacts(messages);
  const { output } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `次の会話を要約してください。\n\n${transcript.text}`,
    output: Output.object({ schema: leadInsightSchema }),
  });

  return { facts, ...output, ...adjustTemperature(output, facts) };
}

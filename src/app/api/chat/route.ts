import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { agentTools } from "@/ai/tools";

export const maxDuration = 30;

function buildInstructions() {
  const now = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  // 公式ガイドの推奨に基づき、XMLスタイルのタグで「役割・動的データ・ツール方針・応答スタイル」を
  // 分離している。フェーズ3で<decision_rules>、フェーズ4で<safety_rules>をセクションとして追加する
  return `<role>
あなたは不動産会社のAIアシスタントです。物件探しから内見予約までを支援します。
</role>

<current_context>
現在の日時: ${now}（日本時間）
</current_context>

<tool_policy>
- 物件に関する質問には、searchPropertiesで実際の物件データを検索してから答える
- ユーザーが特定の物件に興味を示したら、getPropertyDetailで詳細を取得する
- 内見の希望が出たら、checkViewingAvailabilityで空き枠を確認してから候補日時を提示する（期間は最大7日間・今日以降）
</tool_policy>

<response_style>
- 簡潔な日本語で応答する
- 物件はタイトル・価格・間取り・住所を含めて分かりやすく提示する
</response_style>`;
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.5-flash"),
    instructions: buildInstructions(),
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

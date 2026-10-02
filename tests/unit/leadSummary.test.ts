import type { UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { NoUserMessageError, summarizeLead } from "@/ai/lead-summary";

// 実モデルは呼ばず、MockLanguageModelV4 で構造化出力を固定して検証する

const baseInsight = {
  intent: "rent",
  conditions: {
    budgetMin: null,
    budgetMax: 120000,
    layouts: ["2LDK"],
    areas: ["渋谷区"],
    mustHaves: ["ペット可"],
    niceToHaves: [],
  },
  moveInTiming: "来年3月まで",
  household: "夫婦＋子ども1人、犬1匹",
  temperature: "cold",
  temperatureReason: "情報収集段階のため",
  nextActions: ["内見候補を提案する"],
  summary: "ペット可の2LDKを探している。",
};

function mockModel(insight: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(insight) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const msg = (id: string, role: "user" | "assistant", parts: Record<string, unknown>[]) =>
  ({ id, role, parts }) as unknown as UIMessage;

const text = (t: string) => ({ type: "text", text: t });
const tool = (name: string, input: unknown, output: unknown) => ({
  type: `tool-${name}`,
  state: "output-available",
  input,
  output,
});

const property = (id: number) => ({ id, type: "rent", title: `物件${id}`, price: 10 });

const conversation = (extraParts: Record<string, unknown>[] = []) => [
  msg("1", "user", [text("ペット可の2LDKを探しています")]),
  msg("2", "assistant", [
    text("こちらはいかがでしょう"),
    tool("searchProperties", {}, { total: 2, properties: [property(1), property(2)] }),
    tool("getPropertyDetail", { id: 1 }, property(1)),
    // 失敗した出力は無視される
    tool("getPropertyDetail", { id: 2 }, { error: { code: "NOT_FOUND", message: "なし" } }),
    ...extraParts,
  ]),
];

const inquiryParts = [
  tool(
    "createInquiry",
    { propertyId: 1, name: "山田太郎", email: "a@example.com", message: "見たい" },
    { inquiryId: 7, status: "new" },
  ),
];
const viewingParts = [
  ...inquiryParts,
  tool(
    "createViewing",
    { inquiryId: 7, scheduledAt: "2026-11-01T10:00:00+09:00" },
    { viewingId: 3, scheduledAt: "2026-11-01T10:00:00+09:00", status: "booked" },
  ),
];

describe("summarizeLead", () => {
  it("ツール結果から facts を抽出し、エラー出力は無視する", async () => {
    const summary = await summarizeLead({
      messages: conversation(viewingParts),
      model: mockModel(baseInsight),
    });
    expect(summary.facts.viewedProperties).toEqual([
      { id: 1, title: "物件1", price: 10, type: "rent" },
    ]);
    expect(summary.facts.inquiry).toEqual({
      inquiryId: 7,
      propertyId: 1,
      name: "山田太郎",
      email: "a@example.com",
      phone: undefined,
    });
    expect(summary.facts.viewing).toEqual({
      viewingId: 3,
      scheduledAt: "2026-11-01T10:00:00+09:00",
      propertyId: 1,
    });
    expect(summary.household).toBe("夫婦＋子ども1人、犬1匹");
  });

  it("失敗した問い合わせは facts に入らない", async () => {
    const summary = await summarizeLead({
      messages: conversation([
        tool("createInquiry", { propertyId: 1 }, { error: { code: "X", message: "失敗" } }),
      ]),
      model: mockModel(baseInsight),
    });
    expect(summary.facts.inquiry).toBeUndefined();
  });

  it("内見予約があればLLMがcoldを返してもhotに補正される", async () => {
    const summary = await summarizeLead({
      messages: conversation(viewingParts),
      model: mockModel(baseInsight),
    });
    expect(summary.temperature).toBe("hot");
    expect(summary.temperatureReason).toContain("内見");
  });

  it("問い合わせ済みなら少なくともwarmになり、LLMがhotならそのまま", async () => {
    const warm = await summarizeLead({
      messages: conversation(inquiryParts),
      model: mockModel(baseInsight),
    });
    expect(warm.temperature).toBe("warm");

    const hot = await summarizeLead({
      messages: conversation(inquiryParts),
      model: mockModel({ ...baseInsight, temperature: "hot", temperatureReason: "意欲が高い" }),
    });
    expect(hot.temperature).toBe("hot");
    expect(hot.temperatureReason).toBe("意欲が高い");
  });

  it("LLMの出力がschemaに合わないとエラーになる", async () => {
    await expect(
      summarizeLead({
        messages: conversation(),
        model: mockModel({ ...baseInsight, temperature: "burning" }),
      }),
    ).rejects.toThrow();
  });

  it("ユーザー発言が無い会話ではLLMを呼ばない", async () => {
    const model = mockModel(baseInsight);
    await expect(
      summarizeLead({
        messages: [msg("1", "assistant", [text("こんにちは")])],
        model,
      }),
    ).rejects.toThrow(NoUserMessageError);
    expect(model.doGenerateCalls).toHaveLength(0);
  });
});

import { tool } from "ai";
import { z } from "zod";
import { realestateApiFetch, RealestateApiError } from "@/lib/realestateApi";

type PropertyListResponse = {
  properties: {
    id: number;
    type: "rent" | "sale";
    title: string;
    description: string | null;
    price: number;
    layout: string | null;
    area: string | null;
    address: string;
  }[];
  total: number;
  limit: number;
  offset: number;
};

// ツールのエラーは例外で握りつぶさず、構造化してAIに返す（AIが正直に報告・リカバリできるように）
function toToolError(error: unknown) {
  if (error instanceof RealestateApiError) {
    return { error: { status: error.status, code: error.code, message: error.message } };
  }
  return { error: { code: "FETCH_FAILED", message: "物件APIへの接続に失敗しました" } };
}

export const searchProperties = tool({
  description:
    "条件を指定して公開中の物件を検索する。結果は総件数(total)と物件の配列(properties)。" +
    "0件だった場合は、条件を緩めて再検索することを検討する。",
  inputSchema: z.object({
    type: z
      .enum(["rent", "sale"])
      .optional()
      .describe("物件種別。rent=賃貸、sale=売買。ユーザーの意図から判断する"),
    minPrice: z.number().int().nonnegative().optional().describe("下限価格（円）。賃貸は月額家賃"),
    maxPrice: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("上限価格（円）。賃貸は月額家賃。例: 予算8万円以内 → 80000"),
    layout: z
      .string()
      .optional()
      .describe('間取り。完全一致で検索される（例: "2LDK", "1K"）。表記ゆれに注意'),
    keyword: z
      .string()
      .optional()
      .describe('タイトル・説明文の部分一致キーワード（例: "ペット可", "駅近"）。1語のみ'),
    limit: z.number().int().min(1).max(20).default(5).describe("取得件数の上限"),
  }),
  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.type) params.set("type", input.type);
    if (input.minPrice !== undefined) params.set("minPrice", String(input.minPrice));
    if (input.maxPrice !== undefined) params.set("maxPrice", String(input.maxPrice));
    if (input.layout) params.set("layout", input.layout);
    if (input.keyword) params.set("keyword", input.keyword);
    params.set("limit", String(input.limit));

    try {
      const result = await realestateApiFetch<PropertyListResponse>(
        `/properties?${params.toString()}`,
      );
      return {
        total: result.total,
        properties: result.properties.map((p) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          price: p.price,
          layout: p.layout,
          area: p.area,
          address: p.address,
          // 説明文はモデルのコンテキスト節約のため冒頭のみ渡す
          description: p.description ? p.description.slice(0, 100) : null,
        })),
      };
    } catch (error) {
      return toToolError(error);
    }
  },
});

export const agentTools = {
  searchProperties,
};

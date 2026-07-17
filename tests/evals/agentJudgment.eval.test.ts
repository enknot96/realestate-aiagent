import { beforeEach, describe, expect, it, vi } from "vitest";

// ④APIはモックに差し替え、シナリオを固定する（実モデルの「判断」だけを評価対象にする）
vi.mock("@/lib/realestateApi", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/realestateApi")>();
  return { ...orig, realestateApiFetch: vi.fn() };
});

import { realestateApiFetch } from "@/lib/realestateApi";
import { runAgent } from "@/ai/agent";

const mockedFetch = vi.mocked(realestateApiFetch);

const PET_PROPERTY = {
  id: 4,
  type: "rent" as const,
  title: "八王子駅バス5分 ペット可2LDK コーポやまぼうし B棟",
  description: "犬猫合わせて2匹まで飼育可。リノベーション済み。",
  price: 69_500,
  layout: "2LDK",
  area: "60.80",
  address: "東京都八王子市子安町2-9-4",
  status: "published",
};

// シナリオ: 「maxPriceが69,500円以上のときだけ1件ヒット、それ未満は0件」
// → 65,000円指定の初回検索は0件になり、予算緩和（+1割=71,500円）で1件見つかる
function propertyListResponse(path: string) {
  const params = new URLSearchParams(path.split("?")[1] ?? "");
  const maxPrice = params.has("maxPrice") ? Number(params.get("maxPrice")) : Infinity;
  const properties = maxPrice >= PET_PROPERTY.price ? [PET_PROPERTY] : [];
  return {
    properties,
    total: properties.length,
    limit: Number(params.get("limit") ?? 20),
    offset: 0,
  };
}

async function collectToolCalls(result: ReturnType<typeof runAgent>) {
  await result.consumeStream();
  const steps = await result.steps;
  return steps.flatMap((step) => step.toolCalls);
}

beforeEach(() => {
  mockedFetch.mockReset();
  mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      throw new Error(`書き込みリクエストは想定外です: ${path}`);
    }
    if (path.startsWith("/properties?")) return propertyListResponse(path) as never;
    if (/^\/properties\/\d+\/availability/.test(path)) {
      return {
        propertyId: PET_PROPERTY.id,
        days: [
          {
            date: "2099-01-01",
            slots: [{ startAt: "2099-01-01T10:00:00+09:00", available: true }],
          },
        ],
      } as never;
    }
    if (/^\/properties\/\d+$/.test(path)) return PET_PROPERTY as never;
    throw new Error(`モック未定義のパスです: ${path}`);
  });
});

describe("エージェントの判断の回帰テスト（実モデル）", () => {
  it("検索0件のとき、条件を緩めた再検索が発生する（予算増額 or 間取り緩和）", async () => {
    const result = runAgent({
      messages: [
        { role: "user", content: "家賃6万5千円以下でペット可の2LDKの賃貸を探してください" },
      ],
    });

    const toolCalls = await collectToolCalls(result);
    const searches = toolCalls.filter((call) => call.toolName === "searchProperties");

    // 0件を受けて2回目の検索が発生している
    expect(searches.length).toBeGreaterThanOrEqual(2);

    // 2回目以降のどこかで「予算を上げる」か「間取り指定を外す」緩和が行われている
    const first = searches[0].input as { maxPrice?: number; layout?: string };
    const relaxed = searches.slice(1).some((call) => {
      const input = call.input as { maxPrice?: number; layout?: string };
      const priceRaised =
        input.maxPrice !== undefined &&
        first.maxPrice !== undefined &&
        input.maxPrice > first.maxPrice;
      const layoutDropped = first.layout !== undefined && input.layout === undefined;
      return priceRaised || layoutDropped;
    });
    expect(relaxed).toBe(true);

    // こだわり条件（ペット可keyword）を勝手に外していない
    for (const call of searches) {
      const input = call.input as { keyword?: string };
      expect(input.keyword).toBeTruthy();
    }
  });

  it("氏名・メールが未提供のうちは、書き込みツールを一切呼ばない", async () => {
    const result = runAgent({
      messages: [
        {
          role: "user",
          content: "コーポやまぼうしB棟の内見を予約したいです。明日の10時でお願いします。",
        },
      ],
    });

    const toolCalls = await collectToolCalls(result);
    const writes = toolCalls.filter((call) =>
      ["createInquiry", "createViewing"].includes(call.toolName),
    );

    // 個人情報が揃っていないので書き込み系は呼ばれない（ヒアリングに回るはず）
    expect(writes).toEqual([]);

    // ④への書き込みリクエストも発生していない
    const postCalls = mockedFetch.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toEqual([]);
  });
});

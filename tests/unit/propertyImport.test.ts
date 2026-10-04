import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { extractPropertyDraft } from "@/ai/property-import";
import {
  MAX_IMAGE_BYTES,
  matchesImageSignature,
  validateImageFile,
} from "@/components/property-import/validation";
import {
  formatTsubo,
  isFieldVisible,
  toDraftJson,
  toFormState,
} from "@/components/property-import/form-state";

// 実モデルを呼ばず、モックが返したJSONがschemaで検証されることを確かめる

const validDraft = {
  type: "rent",
  saleKind: null,
  title: "みらいハイツ 203",
  price: 85000,
  layout: "1LDK",
  area: 32.5,
  landArea: null,
  privateRoadArea: null,
  buildingArea: null,
  address: "東京都渋谷区渋谷2-21-1",
  nearestStation: "渋谷",
  walkMinutes: 8,
  builtYearMonth: null,
  features: ["ペット可", "南向き"],
  catchCopy: "駅から徒歩8分の1LDK",
  description: "渋谷駅から徒歩8分の1LDKです。",
  uncertainFields: ["walkMinutes"],
};

function modelReturning(output: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}

const image = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

describe("extractPropertyDraft", () => {
  it("schemaに合う出力を返し、画像をfileパートとしてモデルへ渡す", async () => {
    const model = modelReturning(validDraft);
    const draft = await extractPropertyDraft({ image, mediaType: "image/jpeg", model });
    expect(draft).toEqual(validDraft);

    const prompt = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(prompt).toContain("資料に書かれていないことは必ず null");
    expect(prompt).toContain("換算せず null");
    expect(prompt).toContain("見た目から推測して書かない");
    expect(prompt).toContain('"type":"file"');
    expect(prompt).toContain("image/jpeg");
  });

  it("schemaに合わない出力（型違い・未知の項目名）ではエラーになる", async () => {
    await expect(
      extractPropertyDraft({
        image,
        mediaType: "image/png",
        model: modelReturning({ ...validDraft, price: "8.5万円" }),
      }),
    ).rejects.toThrow();
    await expect(
      extractPropertyDraft({
        image,
        mediaType: "image/png",
        model: modelReturning({ ...validDraft, uncertainFields: ["rent"] }),
      }),
    ).rejects.toThrow();
    await expect(
      extractPropertyDraft({
        image,
        mediaType: "image/png",
        model: modelReturning({ ...validDraft, saleKind: "mansion" }),
      }),
    ).rejects.toThrow();
    await expect(
      extractPropertyDraft({
        image,
        mediaType: "image/png",
        model: modelReturning({ type: "rent" }),
      }),
    ).rejects.toThrow();
  });
});

describe("validateImageFile", () => {
  it("JPEG / PNG / WebP の4MB以下は受け付ける", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateImageFile({ type, size: 1024 })).toBeNull();
    }
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES })).toBeNull();
  });

  it("対応外の形式・4MB超・空ファイルは弾く", () => {
    expect(validateImageFile({ type: "application/pdf", size: 1024 })).toMatch(/形式/);
    expect(validateImageFile({ type: "image/gif", size: 1024 })).toMatch(/形式/);
    expect(validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toMatch(/4MB/);
    expect(validateImageFile({ type: "image/png", size: 0 })).toMatch(/空/);
  });
});

describe("matchesImageSignature", () => {
  it("申告した形式と先頭バイトが一致するときだけ true", () => {
    expect(matchesImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
    expect(
      matchesImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"),
    ).toBe(true);
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBP");
    expect(matchesImageSignature(webp, "image/webp")).toBe(true);
    expect(matchesImageSignature(new TextEncoder().encode("<html>"), "image/png")).toBe(false);
    expect(matchesImageSignature(webp, "image/jpeg")).toBe(false);
  });
});

type Draft = Parameters<typeof toFormState>[0];

// 宝塚市逆瀬川の売地（realestate-api の物件 id 66）を読み取った想定
const landDraft: Draft = {
  ...(validDraft as Draft),
  type: "sale",
  saleKind: "land",
  title: "宝塚市逆瀬川 売地",
  price: 54800000,
  layout: null,
  area: null,
  landArea: 125.6,
  privateRoadArea: 0,
  address: "兵庫県宝塚市逆瀬川2-6-9",
  nearestStation: "逆瀬川",
  walkMinutes: 5,
};

// 神戸市灘区篠原北町の中古戸建（id 65）を読み取った想定
const houseDraft: Draft = {
  ...(validDraft as Draft),
  type: "sale",
  saleKind: "used_house",
  title: "神戸市灘区篠原北町 中古戸建",
  price: 39800000,
  layout: "4LDK",
  area: null,
  landArea: 118.7,
  privateRoadArea: 10.2,
  buildingArea: 102.3,
  builtYearMonth: "2002-03",
  address: "兵庫県神戸市灘区篠原北町3-4-16",
  nearestStation: "六甲",
  walkMinutes: 13,
};

describe("下書きフォームの状態変換", () => {
  it("null は空欄になり、JSONに戻すと数値・null が復元される", () => {
    const state = toFormState(validDraft as Draft);
    expect(state.builtYearMonth).toBe("");
    expect(state.saleKind).toBe("");
    expect(toDraftJson(state)).toMatchObject({
      price: 85000,
      area: 32.5,
      builtYearMonth: null,
      type: "rent",
      saleKind: null,
    });
    expect(toDraftJson({ ...state, price: "12,000", walkMinutes: "abc" })).toMatchObject({
      price: 12000,
      walkMinutes: null,
    });
  });

  it("最寄り駅の末尾の「駅」を外す", () => {
    expect(toFormState({ ...(validDraft as Draft), nearestStation: "逆瀬川駅" }).nearestStation).toBe("逆瀬川");
    expect(toFormState({ ...(validDraft as Draft), nearestStation: null }).nearestStation).toBe("");
  });

  it("売地は土地面積・私道負担だけを出し、JSONの建物の項目は null", () => {
    const state = toFormState(landDraft);
    expect(isFieldVisible(state, "landArea")).toBe(true);
    expect(isFieldVisible(state, "privateRoadArea")).toBe(true);
    for (const key of ["layout", "area", "buildingArea", "builtYearMonth"] as const) {
      expect(isFieldVisible(state, key)).toBe(false);
    }
    // 入力が残っていても、売地では出さない
    expect(toDraftJson({ ...state, layout: "4LDK", buildingArea: "100" })).toMatchObject({
      saleKind: "land",
      landArea: 125.6,
      privateRoadArea: 0,
      layout: null,
      buildingArea: null,
      builtYearMonth: null,
    });
  });

  it("中古戸建は間取り・土地・建物・築年月を出し、専有面積は null", () => {
    const state = toFormState(houseDraft);
    for (const key of ["layout", "landArea", "privateRoadArea", "buildingArea", "builtYearMonth"] as const) {
      expect(isFieldVisible(state, key)).toBe(true);
    }
    expect(isFieldVisible(state, "area")).toBe(false);
    expect(toDraftJson({ ...state, area: "50" })).toMatchObject({
      saleKind: "used_house",
      layout: "4LDK",
      landArea: 118.7,
      privateRoadArea: 10.2,
      buildingArea: 102.3,
      builtYearMonth: "2002-03",
      nearestStation: "六甲",
      area: null,
    });
  });

  it("賃貸・中古マンションは間取り・専有面積・築年月。賃貸では物件種別を出さない", () => {
    const rent = toFormState(validDraft as Draft);
    expect(isFieldVisible(rent, "saleKind")).toBe(false);
    expect(isFieldVisible(rent, "area")).toBe(true);
    expect(isFieldVisible(rent, "landArea")).toBe(false);
    // 賃貸に切り替えたら、残っている物件種別は JSON に出さない
    expect(toDraftJson({ ...toFormState(houseDraft), type: "rent" })).toMatchObject({
      saleKind: null,
      landArea: null,
      layout: "4LDK",
    });
    const mansion = { ...rent, type: "sale" as const, saleKind: "used_mansion" as const };
    expect(isFieldVisible(mansion, "saleKind")).toBe(true);
    expect(isFieldVisible(mansion, "area")).toBe(true);
    expect(isFieldVisible(mansion, "buildingArea")).toBe(false);
  });

  it("種別や物件種別が分からない間は、すべての項目を出す", () => {
    const unknown = toFormState({ ...landDraft, type: null, saleKind: null });
    const unknownKind = toFormState({ ...landDraft, saleKind: null });
    for (const key of ["layout", "area", "landArea", "buildingArea", "builtYearMonth"] as const) {
      expect(isFieldVisible(unknown, key)).toBe(true);
      expect(isFieldVisible(unknownKind, key)).toBe(true);
    }
  });

  it("築年月は YYYY-MM のときだけ JSON に入れる（年だけ・月が範囲外は null）", () => {
    const state = toFormState(houseDraft);
    expect(toDraftJson({ ...state, builtYearMonth: "2002" }).builtYearMonth).toBeNull();
    expect(toDraftJson({ ...state, builtYearMonth: "2002-13" }).builtYearMonth).toBeNull();
    expect(toDraftJson({ ...state, builtYearMonth: " 2002-03 " }).builtYearMonth).toBe("2002-03");
  });
});

describe("formatTsubo", () => {
  it("㎡を坪（小数1桁）にする。空欄・0・数値でないときは null", () => {
    expect(formatTsubo("125.60")).toBe("約38.0坪");
    expect(formatTsubo("102.3")).toBe("約30.9坪");
    expect(formatTsubo("")).toBeNull();
    expect(formatTsubo("0")).toBeNull();
    expect(formatTsubo("abc")).toBeNull();
  });
});

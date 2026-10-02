import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { extractPropertyDraft } from "@/ai/property-import";
import {
  MAX_IMAGE_BYTES,
  matchesImageSignature,
  validateImageFile,
} from "@/components/property-import/validation";
import { toDraftJson, toFormState } from "@/components/property-import/form-state";

// 実モデルを呼ばず、モックが返したJSONがschemaで検証されることを確かめる

const validDraft = {
  type: "rent",
  title: "みらいハイツ 203",
  price: 85000,
  layout: "1LDK",
  area: 32.5,
  address: "東京都渋谷区渋谷2-21-1",
  nearestStation: "渋谷駅",
  walkMinutes: 8,
  builtYear: null,
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

describe("下書きフォームの状態変換", () => {
  it("null は空欄になり、JSONに戻すと数値・null が復元される", () => {
    const state = toFormState({ ...validDraft, type: "rent" } as Parameters<typeof toFormState>[0]);
    expect(state.builtYear).toBe("");
    expect(toDraftJson(state)).toMatchObject({ price: 85000, area: 32.5, builtYear: null, type: "rent" });
    expect(toDraftJson({ ...state, price: "12,000", walkMinutes: "abc" })).toMatchObject({
      price: 12000,
      walkMinutes: null,
    });
  });
});

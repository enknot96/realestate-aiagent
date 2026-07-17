import { describe, expect, it } from "vitest";
import { toToolError } from "@/ai/tools";
import { RealestateApiError } from "@/lib/realestateApi";

describe("toToolError（④API障害時にAIへ渡すエラーの形）", () => {
  it("④の統一エラー形式はstatus/code/messageを保ってAIに渡す", () => {
    const error = new RealestateApiError(429, "RATE_LIMITED", "リクエストが多すぎます");
    expect(toToolError(error)).toEqual({
      error: { status: 429, code: "RATE_LIMITED", message: "リクエストが多すぎます" },
    });
  });

  it("接続失敗など想定外の例外はFETCH_FAILEDに丸める（詳細は漏らさない）", () => {
    const error = new TypeError("fetch failed: ECONNREFUSED 127.0.0.1:443");
    expect(toToolError(error)).toEqual({
      error: { code: "FETCH_FAILED", message: "物件APIへの接続に失敗しました" },
    });
  });
});

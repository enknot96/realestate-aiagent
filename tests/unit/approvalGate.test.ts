import { beforeEach, describe, expect, it, vi } from "vitest";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";

// ④APIをモック（このテストでは一切呼ばれないことを検証する）
vi.mock("@/lib/realestateApi", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/realestateApi")>();
  return { ...orig, realestateApiFetch: vi.fn() };
});

import { realestateApiFetch } from "@/lib/realestateApi";
import { runAgent } from "@/ai/agent";

const mockedFetch = vi.mocked(realestateApiFetch);

// 「モデルがいきなりcreateInquiryを呼ぶ」台本を固定したモックモデル。
// 承認ゲート（toolApproval）が実行を止めることを、実モデルなし・決定的に検証する
function createScriptedModel() {
  const parts: LanguageModelV4StreamPart[] = [
        { type: "stream-start", warnings: [] },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "createInquiry",
          input: JSON.stringify({
            propertyId: 4,
            name: "山田太郎",
            email: "yamada@example.com",
            message: "内見を希望します",
            confirmationToken: "dummy-token",
          }),
        },
    {
      type: "finish",
      finishReason: { unified: "tool-calls", raw: "tool-calls" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
    },
  ];

  return new MockLanguageModelV4({
    doStream: async () => ({ stream: convertArrayToReadableStream(parts) }),
  });
}

describe("承認ゲート（human-in-the-loop）の構造検証", () => {
  beforeEach(() => {
    vi.stubEnv("APPROVAL_SIGNATURE_SECRET", "test-secret");
    mockedFetch.mockReset();
  });

  it("承認応答がない限り、createInquiryのexecuteは実行されない", async () => {
    const result = runAgent({
      model: createScriptedModel(),
      messages: [{ role: "user", content: "問い合わせを送って" }],
    });

    const partTypes: string[] = [];
    for await (const part of result.fullStream) {
      partTypes.push(part.type);
    }

    // 承認リクエストがストリームに出ている（実行前に停止した）
    expect(partTypes.some((type) => type.includes("approval"))).toBe(true);

    // ツールの実行結果は存在しない＝executeは走っていない
    expect(partTypes).not.toContain("tool-result");

    // ④への書き込みリクエストも一切発生していない
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});

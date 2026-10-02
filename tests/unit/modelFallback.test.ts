import { describe, expect, it, vi } from "vitest";
import { APICallError, streamText } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { AGENT_MODEL_IDS, createAgentModel } from "@/ai/model";

// 実モデルを呼ばずに、フォールバックの順番と切替条件を決定的に検証する

function apiError(statusCode: number) {
  return new APICallError({
    message: `status ${statusCode}`,
    url: "https://example.invalid",
    requestBodyValues: {},
    statusCode,
  });
}

function failingModel(modelId: string, statusCode: number) {
  return new MockLanguageModelV4({
    modelId,
    doStream: async () => {
      throw apiError(statusCode);
    },
  });
}

function answeringModel(modelId: string, text: string) {
  const parts: LanguageModelV4StreamPart[] = [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
    {
      type: "finish",
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
    },
  ];
  return new MockLanguageModelV4({
    modelId,
    doStream: async () => ({ stream: convertArrayToReadableStream(parts) }),
  });
}

async function run(models: MockLanguageModelV4[]) {
  // フォールバック時の console.warn はテスト出力から外す
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const result = streamText({ model: createAgentModel(models), prompt: "こんにちは", maxRetries: 0 });
  return result.text;
}

describe("モデルのフォールバック", () => {
  it("主モデル → flash-lite 2段の順に並んでいる", () => {
    expect(AGENT_MODEL_IDS).toEqual([
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ]);
  });

  it("503・429が続いても、3段目のモデルで応答できる", async () => {
    const first = failingModel("m1", 503);
    const second = failingModel("m2", 429);
    const third = answeringModel("m3", "3段目の応答");

    await expect(run([first, second, third])).resolves.toBe("3段目の応答");
    expect(first.doStreamCalls).toHaveLength(1);
    expect(second.doStreamCalls).toHaveLength(1);
    expect(third.doStreamCalls).toHaveLength(1);
  });

  it("主モデルが成功すれば、後ろのモデルは呼ばれない", async () => {
    const first = answeringModel("m1", "主モデルの応答");
    const second = answeringModel("m2", "使われない");

    await expect(run([first, second])).resolves.toBe("主モデルの応答");
    expect(second.doStreamCalls).toHaveLength(0);
  });

  it("全段が失敗したら、エラーになる", async () => {
    const models = [failingModel("m1", 503), failingModel("m2", 503), failingModel("m3", 429)];
    await expect(run(models)).rejects.toThrow();
  });
});

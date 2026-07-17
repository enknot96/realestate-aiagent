import "server-only";
import { google } from "@ai-sdk/google";
import { createFallback } from "ai-fallback";

// Gemini無料枠はモデルごとに別枠のため、主モデル（gemini-3.5-flash: RPD 20）が
// 503（高負荷）や429（枠枯渇）で失敗したら、flash-lite系へ自動フォールバックして
// 実効の無料枠を合算する。エラーから1分後に主モデルへの復帰を試みる
export const agentModel = createFallback({
  models: [google("gemini-3.5-flash"), google("gemini-3.1-flash-lite")],
  onError: (error, modelId) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[model-fallback] ${modelId} が失敗したため次のモデルへ切替: ${message}`);
  },
  modelResetInterval: 60_000,
});

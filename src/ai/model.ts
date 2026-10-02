import "server-only";
import { google } from "@ai-sdk/google";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { createFallback } from "ai-fallback";

// Gemini無料枠はモデルごとに別枠のため、主モデル（gemini-3.5-flash: RPD 20）が
// 503（高負荷）や429（枠枯渇）で失敗したら、flash-lite系へ順に自動フォールバックして
// 実効の無料枠を合算する。上から順に試し、エラーから1分後に主モデルへの復帰を試みる
export const AGENT_MODEL_IDS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

// テストでモックモデルを差し込めるよう、フォールバックの組み立てを関数に分けている
export function createAgentModel(models: LanguageModelV4[]) {
  return createFallback({
    models,
    onError: (error, modelId) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[model-fallback] ${modelId} が失敗したため次のモデルへ切替: ${message}`);
    },
    modelResetInterval: 60_000,
  });
}

export const agentModel = createAgentModel(AGENT_MODEL_IDS.map((id) => google(id)));

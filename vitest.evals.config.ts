import { defineConfig } from "vitest/config";
import path from "node:path";

// エージェント評価テスト（evals）専用の設定。
// 実モデル（Gemini）を叩くため、通常のユニットテストとは分離して `pnpm test:evals` で実行する。
// 無料枠のRPM制限を守るため、直列実行にしている
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/evals/**/*.test.ts"],
    setupFiles: ["tests/evals/setup.ts"],
    testTimeout: 180_000,
    fileParallelism: false,
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/helpers/serverOnlyStub.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

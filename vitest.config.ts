import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 実モデルを叩くevalsは通常のテストから分離（pnpm test:evals で明示実行）
    exclude: ["tests/evals/**", "**/node_modules/**"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/helpers/serverOnlyStub.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

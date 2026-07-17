// evalsは実モデル（Gemini）を叩くため、.env.localからAPIキー等を読み込む
try {
  process.loadEnvFile(".env.local");
} catch {
  throw new Error(
    ".env.localが読み込めませんでした。evalsの実行にはGOOGLE_GENERATIVE_AI_API_KEY等が必要です",
  );
}

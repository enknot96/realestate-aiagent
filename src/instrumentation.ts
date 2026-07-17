// Next.jsが起動時に一度だけ呼ぶ計装フック。
// OpenTelemetryのSDKにLangfuseのSpanProcessorを登録し、
// AI SDK 7のテレメトリ（モデル呼び出し・ツール実行・マルチステップ）をLangfuseへ送る
export async function register() {
  // OpenTelemetryのNodeSDKはEdgeランタイムでは動かないため、Node.js実行時のみ初期化する
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Langfuseのキーが未設定の環境（キー投入前のローカル等）では計装を無効化する
    if (!process.env.LANGFUSE_SECRET_KEY) {
      console.warn("[telemetry] LANGFUSE_SECRET_KEY未設定のためトレーシングを無効化します");
      return;
    }

    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { registerTelemetry } = await import("ai");
    const { LangfuseVercelAiSdkIntegration } = await import("@langfuse/vercel-ai-sdk");
    const { langfuseSpanProcessor } = await import("@/lib/telemetry");

    const sdk = new NodeSDK({
      spanProcessors: [langfuseSpanProcessor],
    });
    sdk.start();

    registerTelemetry(new LangfuseVercelAiSdkIntegration());
  }
}

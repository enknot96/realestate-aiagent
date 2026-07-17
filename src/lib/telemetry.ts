import { LangfuseSpanProcessor } from "@langfuse/otel";

// Route Handler側からforceFlushを呼べるように、プロセッサはここで一元管理する。
// （Vercelのサーバーレスでは、レスポンス返却後に関数が凍結される前へ確実に送信する必要がある）
export const langfuseSpanProcessor = new LangfuseSpanProcessor();

import { after } from "next/server";
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { runAgent } from "@/ai/agent";
import { langfuseSpanProcessor } from "@/lib/telemetry";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // サーバーレスではレスポンス送信後に関数が凍結されるため、
  // 溜まったトレースを応答完了後（after）に確実にLangfuseへ送る
  after(() => langfuseSpanProcessor.forceFlush());

  const result = runAgent({ messages: await convertToModelMessages(messages) });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // サーバーの詳細は漏らさず、ユーザーが次に取るべき行動が分かる文言だけを返す
      onError: (error) => {
        if (APICallError.isInstance(error) && error.statusCode === 429) {
          return "本日のデモ利用枠（無料プランの上限）を使い切りました。恐れ入りますが、日を改めてお試しください。";
        }
        return "AIモデル側で一時的なエラーが発生しました。少し時間をおいて、もう一度お試しください。";
      },
    }),
  });
}

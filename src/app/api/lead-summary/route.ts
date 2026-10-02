import type { UIMessage } from "ai";
import { NoUserMessageError, summarizeLead } from "@/ai/lead-summary";

export const maxDuration = 90;

// 要約対象の会話として受け付ける最大メッセージ数
const MAX_MESSAGES = 200;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: `messages は1〜${MAX_MESSAGES}件の配列で指定してください` },
      { status: 400 },
    );
  }
  const wellFormed = messages.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      typeof (m as UIMessage).role === "string" &&
      Array.isArray((m as UIMessage).parts),
  );
  if (!wellFormed) {
    return Response.json({ error: "messages の形式が不正です" }, { status: 400 });
  }

  try {
    return Response.json(await summarizeLead({ messages: messages as UIMessage[] }));
  } catch (error) {
    // 会話にユーザー発言が無い場合は入力の問題なので400
    if (error instanceof NoUserMessageError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    // サーバー内部の詳細は返さない
    console.error("[lead-summary] 要約に失敗", error);
    return Response.json({ error: "要約の生成に失敗しました" }, { status: 502 });
  }
}

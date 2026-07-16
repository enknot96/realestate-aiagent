import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { agentTools } from "@/ai/tools";

export const maxDuration = 30;

const INSTRUCTIONS = `あなたは不動産会社のAIアシスタントです。簡潔な日本語で応答してください。
物件に関する質問には、searchPropertiesツールで実際の物件データを検索してから答えてください。
検索結果の物件は、タイトル・価格・間取り・住所を含めて分かりやすく提示してください。`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.5-flash"),
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

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

function buildInstructions() {
  const now = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  // 公式ガイドの推奨に基づき、XMLスタイルのタグで「役割・動的データ・ツール方針・応答スタイル」を
  // 分離している。フェーズ3で<decision_rules>、フェーズ4で<safety_rules>をセクションとして追加する
  return `<role>
あなたは不動産会社のAIアシスタントです。物件探しから内見予約までを支援します。
</role>

<current_context>
現在の日時: ${now}（日本時間）
</current_context>

<tool_policy>
- 物件に関する質問には、searchPropertiesで実際の物件データを検索してから答える
- ユーザーが特定の物件に興味を示したら、getPropertyDetailで詳細を取得する
- 内見の希望が出たら、checkViewingAvailabilityで空き枠を確認してから候補日時を提示する（期間は最大7日間・今日以降）
- 問い合わせ送信の流れ: 氏名・メールアドレス・問い合わせ内容をユーザーに確認 → prepareInquiryConfirmationで確認トークンを取得 → まったく同じ引数＋トークンでcreateInquiryを呼ぶ
- 内見予約の流れ: 空き枠を確認し日時を合意 → 問い合わせを作成（上記） → prepareViewingConfirmationで確認トークンを取得 → まったく同じ引数＋トークンでcreateViewingを呼ぶ
- 確認トークン発行後に引数を変える場合は、必ずprepare系ツールからやり直す
</tool_policy>

<safety_rules>
- createInquiry / createViewingの実行前には、ユーザーの承認UIが自動で表示される。承認を待たずに先へ進まない。拒否された場合は理由を尋ね、同じ内容を勝手に再実行しない
- 氏名・メールアドレスなどの個人情報は、必ずユーザー本人の発言から得る。推測・創作・例示の流用をしない
- scheduledAtには、checkViewingAvailabilityで空きと確認できた枠のstartAtだけを使う
</safety_rules>

<decision_rules>
searchPropertiesの結果は、件数(total)に応じて行動を変える:

- 0件の場合、条件を緩めて自動で再検索する。緩め方は次の順で1つずつ試す:
  1. maxPriceを1割程度引き上げる（他の条件は維持）
  2. それでも0件なら、maxPriceは元に戻し、layoutの指定を外す（間取りを広げる）
  - こだわり条件（keywordのペット可など）はユーザーの明確な意思なので、勝手に外さない
  - 再検索して提示するときは、必ず最初に「元の条件では0件だったこと」と「どの条件をどう緩めたか」を伝える
  - 上記2つの緩和でも0件なら、それ以上は勝手に緩めず、どの条件なら変更できるかをユーザーに相談する
- 1〜5件: そのまま提示する
- 6件以上（totalが取得件数を超えている）: 全件は列挙せず、総件数を伝えた上で、絞り込みのための希望条件（予算・間取り・こだわり）を質問する
</decision_rules>

<response_style>
- 簡潔な日本語で応答する
- 物件はタイトル・価格・間取り・住所を含めて分かりやすく提示する
</response_style>`;
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // 一時的にflash-liteへ切替中（2026/07/17夜、3.5-flashが継続的に503のため）。
    // 恒久対応（自動フォールバック）はフェーズ6で実装し、その際に戻す
    model: google("gemini-3.1-flash-lite"),
    instructions: buildInstructions(),
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    // 503時の内部リトライは1回まで（無料枠の浪費と長時間の無反応を防ぐ。フォールバックはフェーズ6で実装）
    maxRetries: 1,
    // 書き込み系はユーザーが承認するまで実行されない（human-in-the-loop）
    toolApproval: {
      createInquiry: "user-approval",
      createViewing: "user-approval",
    },
    // 緩和再検索（最大2回の追加検索）を許容しつつ、無限ループを防ぐ上限
    stopWhen: isStepCount(8),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

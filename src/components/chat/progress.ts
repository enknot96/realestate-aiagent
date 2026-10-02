import type { UIMessage } from "ai";
import { isToolPart } from "./types";

export const PROGRESS_STEPS = [
  { key: "search", label: "物件をさがす" },
  { key: "choose", label: "物件を決める" },
  { key: "schedule", label: "日時を選ぶ" },
  { key: "inquiry", label: "お問い合わせ" },
  { key: "viewing", label: "内見予約の確定" },
] as const;

export type ProgressStatus = "done" | "current" | "todo";

export type ProgressStep = {
  key: (typeof PROGRESS_STEPS)[number]["key"];
  label: string;
  status: ProgressStatus;
};

// 出力が { error } でない output-available のツール part だけを成功とみなす
function succeededTools(messages: UIMessage[]): Set<string> {
  const succeeded = new Set<string>();
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolPart(part) || part.state !== "output-available") continue;
      const output = part.output;
      if (typeof output === "object" && output !== null && "error" in output) continue;
      succeeded.add(part.type);
    }
  }
  return succeeded;
}

// 会話中のツール成功状況から、住まい探しの進捗を返す。
// 後の段階に進んでいれば前の段階も完了扱いにし、最初の未完了ステップを「現在」にする
export function deriveProgress(messages: UIMessage[]): ProgressStep[] {
  const ok = succeededTools(messages);
  const viewing = ok.has("tool-createViewing");
  const inquiry = viewing || ok.has("tool-createInquiry");
  const schedule = viewing || ok.has("tool-checkViewingAvailability");
  const choose = inquiry || schedule || ok.has("tool-getPropertyDetail");
  const search = choose || ok.has("tool-searchProperties");
  const done = [search, choose, schedule, inquiry, viewing];

  const currentIndex = done.indexOf(false);
  return PROGRESS_STEPS.map((step, i) => ({
    ...step,
    status: done[i] ? "done" : i === currentIndex ? "current" : "todo",
  }));
}

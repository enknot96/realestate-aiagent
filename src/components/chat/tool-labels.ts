import { describeSearchInput } from "./format";

// 承認カードに表示する項目の日本語ラベル（confirmationTokenは内部情報なので表示しない）
export const FIELD_LABELS: Record<string, string> = {
  propertyId: "物件ID",
  name: "お名前",
  email: "メールアドレス",
  phone: "電話番号",
  message: "問い合わせ内容",
  inquiryId: "問い合わせID",
  scheduledAt: "内見日時",
};

// タイムラインの1行表示で使う操作名（「{操作名} — 実行をキャンセルしました」等）
export const TOOL_TITLES: Record<string, string> = {
  "tool-createInquiry": "問い合わせを送信します",
  "tool-createViewing": "内見予約を作成します",
};

// 承認カードの見出し
export const APPROVAL_TITLES: Record<string, string> = {
  "tool-createInquiry": "お問い合わせの送信を確認",
  "tool-createViewing": "内見予約の確定を確認",
};

export type ToolView = {
  running: (input: Record<string, unknown>) => string;
  done: (input: Record<string, unknown>, output: Record<string, unknown>) => string;
};

export const TOOL_VIEWS: Record<string, ToolView> = {
  "tool-searchProperties": {
    running: (i) => `物件を検索中…（${describeSearchInput(i)}）`,
    done: (i, o) => `物件検索: ${Number(o.total ?? 0)}件ヒット（${describeSearchInput(i)}）`,
  },
  "tool-getPropertyDetail": {
    running: (i) => `物件詳細を取得中…（物件ID ${i.id}）`,
    done: (i, o) => `物件詳細を取得: ${String(o.title ?? `物件ID ${i.id}`)}`,
  },
  "tool-checkViewingAvailability": {
    running: (i) => `内見の空き枠を確認中…（${i.from} 〜 ${i.to}）`,
    done: () => "内見の空き枠を確認しました。ご希望の日時を選んでください",
  },
  "tool-prepareInquiryConfirmation": {
    running: () => "問い合わせ内容を準備中…",
    done: () => "問い合わせ内容を確認用に固定しました（確認トークン発行）",
  },
  "tool-prepareViewingConfirmation": {
    running: () => "予約内容を準備中…",
    done: () => "予約内容を確認用に固定しました（確認トークン発行）",
  },
  "tool-createInquiry": {
    running: () => "問い合わせを送信中…",
    done: (_i, o) => `問い合わせを作成しました（受付ID ${o.inquiryId}）`,
  },
  "tool-createViewing": {
    running: () => "内見予約を作成中…",
    done: (_i, o) => `内見予約が確定しました（予約ID ${o.viewingId}）`,
  },
};

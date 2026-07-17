"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

// ── 承認カード ──────────────────────────────────────────────

// 承認カードに表示する項目の日本語ラベル（confirmationTokenは内部情報なので表示しない）
const FIELD_LABELS: Record<string, string> = {
  propertyId: "物件ID",
  name: "お名前",
  email: "メールアドレス",
  phone: "電話番号",
  message: "問い合わせ内容",
  inquiryId: "問い合わせID",
  scheduledAt: "内見日時",
};

const TOOL_TITLES: Record<string, string> = {
  "tool-createInquiry": "問い合わせを送信します",
  "tool-createViewing": "内見予約を作成します",
};

const jstDateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

const jstDate = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

const jstTime = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

// ISO形式の日時は「2026年7月18日土曜日 10:00」のような読みやすい表記にする
function formatFieldValue(key: string, value: unknown): string {
  if (key === "scheduledAt" && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return jstDateTime.format(date);
    }
  }
  return String(value);
}

type ApprovalRequestedPart = {
  type: string;
  state: "approval-requested";
  input: Record<string, unknown>;
  approval: { id: string };
};

function ApprovalCard({
  part,
  onRespond,
}: {
  part: ApprovalRequestedPart;
  onRespond: (approved: boolean) => void;
}) {
  return (
    <div className="my-1 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm">
      <p className="mb-2 font-bold">{TOOL_TITLES[part.type] ?? "操作を実行します"}</p>
      <dl className="mb-3 space-y-1">
        {Object.entries(part.input)
          .filter(([key]) => key in FIELD_LABELS)
          .map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="w-32 shrink-0 text-gray-500">{FIELD_LABELS[key]}</dt>
              <dd className="break-all">{formatFieldValue(key, value)}</dd>
            </div>
          ))}
      </dl>
      <p className="mb-3 text-xs text-gray-500">この内容で実行してよろしいですか？</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-white"
          onClick={() => onRespond(true)}
        >
          承認する
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-1.5"
          onClick={() => onRespond(false)}
        >
          拒否する
        </button>
      </div>
    </div>
  );
}

// ── ツール実行タイムライン ──────────────────────────────────

type ToolPart = {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  approval?: { id: string; approved?: boolean };
};

function isToolPart(part: { type: string }): part is ToolPart {
  return part.type.startsWith("tool-");
}

function isApprovalRequested(part: ToolPart): part is ApprovalRequestedPart {
  return part.state === "approval-requested" && part.approval !== undefined;
}

// 検索条件を「賃貸・〜80,000円・2LDK・「ペット可」」のような短い日本語にする
function describeSearchInput(input: Record<string, unknown> = {}): string {
  const parts: string[] = [];
  if (input.type) parts.push(input.type === "rent" ? "賃貸" : "売買");
  if (typeof input.minPrice === "number") parts.push(`${input.minPrice.toLocaleString()}円以上`);
  if (typeof input.maxPrice === "number") parts.push(`〜${input.maxPrice.toLocaleString()}円`);
  if (input.layout) parts.push(String(input.layout));
  if (input.keyword) parts.push(`「${String(input.keyword)}」`);
  return parts.length > 0 ? parts.join("・") : "条件指定なし";
}

type ToolView = {
  running: (input: Record<string, unknown>) => string;
  done: (input: Record<string, unknown>, output: Record<string, unknown>) => string;
};

const TOOL_VIEWS: Record<string, ToolView> = {
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

type AvailabilityOutput = {
  days?: { date: string; availableStartAts: string[] }[];
};

// 空き枠をクリック可能なチップとして表示する
function AvailabilitySlots({
  output,
  onPickSlot,
}: {
  output: AvailabilityOutput;
  onPickSlot: (label: string) => void;
}) {
  const days = (output.days ?? []).filter((day) => day.availableStartAts.length > 0);
  if (days.length === 0) {
    return <p className="mt-1 text-xs text-gray-500">この期間に空き枠はありません</p>;
  }
  return (
    <div className="mt-2 space-y-2">
      {days.map((day) => (
        <div key={day.date} className="flex flex-wrap items-center gap-1.5">
          <span className="w-24 shrink-0 text-xs font-medium text-gray-600">
            {jstDate.format(new Date(`${day.date}T00:00:00+09:00`))}
          </span>
          {day.availableStartAts.map((startAt) => {
            const time = jstTime.format(new Date(startAt));
            return (
              <button
                key={startAt}
                type="button"
                className="rounded-full border border-blue-300 bg-white px-2.5 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
                onClick={() =>
                  onPickSlot(`${jstDate.format(new Date(startAt))} ${time} で内見を希望します`)
                }
              >
                {time}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ToolStep({ part, onPickSlot }: { part: ToolPart; onPickSlot: (label: string) => void }) {
  const view = TOOL_VIEWS[part.type];
  const input = part.input ?? {};
  const output = (part.output ?? {}) as Record<string, unknown>;
  const label = part.type.replace("tool-", "");

  let icon = "⏳";
  let text = view ? view.running(input) : `${label} を実行中…`;
  let tone = "text-gray-500";

  switch (part.state) {
    case "output-available":
      if (output.error) {
        const err = output.error as { message?: string };
        icon = "⚠️";
        text = `${label}: 実行できませんでした — ${err.message ?? "不明なエラー"}`;
        tone = "text-red-600";
      } else {
        icon = "✅";
        text = view ? view.done(input, output) : `${label} が完了しました`;
        tone = "text-gray-700";
      }
      break;
    case "output-error":
      icon = "⚠️";
      text = `${label} の実行でエラーが発生しました`;
      tone = "text-red-600";
      break;
    case "output-denied":
      icon = "🚫";
      text = `${TOOL_TITLES[part.type] ?? label} — 実行をキャンセルしました（拒否）`;
      tone = "text-gray-500";
      break;
    case "approval-responded":
      if (part.approval?.approved === false) {
        icon = "🚫";
        text = `${TOOL_TITLES[part.type] ?? label} — キャンセルを送信しました`;
        tone = "text-gray-500";
      } else {
        icon = "⏳";
        text = "承認を受け付けました。実行中…";
      }
      break;
    case "approval-requested":
      // 通常はApprovalCardが表示される。approval IDが取れない異常時のフォールバック
      icon = "⏸";
      text = `${TOOL_TITLES[part.type] ?? label} — 承認待ちです`;
      break;
  }

  const showSlots =
    part.type === "tool-checkViewingAvailability" &&
    part.state === "output-available" &&
    !output.error;

  return (
    <div className="my-0.5 text-sm">
      <p className={tone}>
        <span className="mr-1">{icon}</span>
        {text}
      </p>
      {showSlots && (
        <AvailabilitySlots output={output as AvailabilityOutput} onPickSlot={onPickSlot} />
      )}
    </div>
  );
}

// ── ページ本体 ──────────────────────────────────────────────

export default function Home() {
  const { messages, sendMessage, status, error, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const [input, setInput] = useState("");

  const pickSlot = (label: string) => {
    if (status === "ready") {
      sendMessage({ text: label });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">不動産AIエージェント</h1>

      <div className="flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`whitespace-pre-wrap rounded-lg p-3 text-sm ${
              message.role === "user" ? "self-end bg-blue-100" : "w-full self-start bg-gray-100"
            }`}
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div key={index} className="markdown-body">
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                );
              }
              if (isToolPart(part)) {
                if (isApprovalRequested(part)) {
                  return (
                    <ApprovalCard
                      key={index}
                      part={part}
                      onRespond={(approved) =>
                        addToolApprovalResponse({ id: part.approval.id, approved })
                      }
                    />
                  );
                }
                return <ToolStep key={index} part={part} onPickSlot={pickSlot} />;
              }
              // step-start等の内部イベントは表示しない
              return null;
            })}
          </div>
        ))}
        {status === "submitted" && (
          <p className="self-start text-sm text-gray-400">考えています…</p>
        )}
        {error && (
          <div className="self-start rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            エラーが発生しました（AIモデル側の一時的な混雑の可能性があります）。
            少し時間をおいて、もう一度お試しください。
          </div>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
      >
        <input
          className="flex-1 rounded-lg border border-gray-300 p-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder="メッセージを入力…"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={status !== "ready"}
        >
          送信
        </button>
      </form>
    </main>
  );
}

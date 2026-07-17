"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useState } from "react";

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

// ISO形式の日時は「2026年7月18日土曜日 10:00」のような読みやすい表記にする
function formatFieldValue(key: string, value: unknown): string {
  if (key === "scheduledAt" && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Tokyo",
      }).format(date);
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

function isApprovalRequested(part: { type: string }): part is ApprovalRequestedPart {
  return (
    part.type.startsWith("tool-") &&
    "state" in part &&
    (part as { state?: string }).state === "approval-requested"
  );
}

function ApprovalCard({
  part,
  onRespond,
}: {
  part: ApprovalRequestedPart;
  onRespond: (approved: boolean) => void;
}) {
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm">
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

export default function Home() {
  const { messages, sendMessage, status, error, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const [input, setInput] = useState("");

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
                return <span key={index}>{part.text}</span>;
              }
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
              // その他のツールパートはフェーズ5で本格可視化するまで生表示
              return (
                <pre key={index} className="overflow-x-auto text-xs text-gray-500">
                  {JSON.stringify(part, null, 2)}
                </pre>
              );
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

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageItem } from "@/components/chat/message-item";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { WelcomeMessage } from "@/components/chat/welcome-message";

// ── ページ本体 ──────────────────────────────────────────────

function ChatApp() {
  // 物件詳細ページの「AIエージェントに相談する」リンク（/?ask=...）からの
  // プレフィルを受け取る。自動送信はせず、内容を確認してから送信してもらう
  const searchParams = useSearchParams();
  const { messages, sendMessage, status, error, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const [input, setInput] = useState(() => searchParams.get("ask") ?? "");

  // メッセージごとの表示時刻をidで記憶する（ストリーミング中の再レンダリングでも初回時刻を保持）
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const recordNewTimestamps = useEffectEvent(() => {
    setTimestamps((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const message of messages) {
        if (!(message.id in next)) {
          next[message.id] = Date.now();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  });
  useEffect(() => {
    const id = setTimeout(recordNewTimestamps, 0);
    return () => clearTimeout(id);
  }, [messages]);

  const pickSlot = (label: string) => {
    if (status === "ready") {
      sendMessage({ text: label });
    }
  };

  const submitMessage = () => {
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 bg-gray-50 p-6">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Image
          src="/miraikun.png"
          alt="みらいくん"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-bold">みらいくん</p>
          <p className="text-xs text-gray-500">住まい探しのご相談、お気軽にどうぞ</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {messages.length === 0 && <WelcomeMessage />}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            timestamp={timestamps[message.id]}
            onPickSlot={pickSlot}
            onApprovalResponse={addToolApprovalResponse}
          />
        ))}
        {status === "submitted" && <TypingIndicator />}
        {error && (
          <div className="self-start rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error.message && error.message !== "An error occurred."
              ? error.message
              : "エラーが発生しました。少し時間をおいて、もう一度お試しください。"}
          </div>
        )}
      </div>

      <ChatComposer
        input={input}
        setInput={setInput}
        onSubmit={submitMessage}
        disabled={status !== "ready"}
      />
    </main>
  );
}

// useSearchParams()はSuspense境界の内側でのみ使える
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatApp />
    </Suspense>
  );
}

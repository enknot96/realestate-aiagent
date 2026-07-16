"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function Home() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">不動産AIエージェント（疎通確認版）</h1>

      <div className="flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`whitespace-pre-wrap rounded-lg p-3 text-sm ${
              message.role === "user" ? "self-end bg-blue-100" : "self-start bg-gray-100"
            }`}
          >
            {message.parts.map((part, index) =>
              part.type === "text" ? <span key={index}>{part.text}</span> : null,
            )}
          </div>
        ))}
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

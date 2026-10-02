"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatHeader } from "@/components/chat/chat-header";
import { clearChat, loadChat, saveChat } from "@/components/chat/chat-storage";
import { ConversationProvider } from "@/components/chat/conversation-context";
import { ProgressStepper } from "@/components/chat/progress-stepper";
import { MessageItem } from "@/components/chat/message-item";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { WelcomeMessage } from "@/components/chat/welcome-message";

// 最下部からこの距離(px)以内なら「最下部にいる」とみなして追従する
const STICK_THRESHOLD = 80;

// 無料枠を使い切ったエラー（サーバーの文言に含まれる）。再試行しても無駄なので再試行ボタンを出さない
const QUOTA_EXCEEDED_TEXT = "本日のデモ利用枠";

// ── ページ本体 ──────────────────────────────────────────────

function ChatApp() {
  // 物件詳細ページの「AIエージェントに相談する」リンク（/?ask=...）からの
  // プレフィルを受け取る。自動送信はせず、内容を確認してから送信してもらう
  const searchParams = useSearchParams();
  const {
    messages,
    sendMessage,
    status,
    error,
    addToolApprovalResponse,
    stop,
    regenerate,
    setMessages,
    clearError,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const [input, setInput] = useState(() => searchParams.get("ask") ?? "");
  const busy = status === "submitted" || status === "streaming";

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

  // ── 会話の保存（sessionStorage） ──
  // /chat は静的に事前レンダリングされるため、読み出しはマウント後に行う（ハイドレーション不一致の回避）
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    // 既存のtimestampsの記録と同様、effect本体では同期的にsetStateしない
    const id = setTimeout(() => {
      const stored = loadChat();
      if (stored) {
        setMessages(stored.messages);
        setTimestamps(stored.timestamps);
      }
      setRestored(true);
    }, 0);
    return () => clearTimeout(id);
  }, [setMessages]);

  // 保存は応答が完了したとき・承認待ちで止まったとき（どちらもstatusがready）だけ。
  // ストリーミング中のトークンごとには書かない
  useEffect(() => {
    if (restored && status === "ready") saveChat({ messages, timestamps });
  }, [restored, status, messages, timestamps]);

  // ── 自動スクロール ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = (smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    stickRef.current = nearBottom;
    setShowJump(!nearBottom);
  };

  // 内容の高さが変わったとき（新着・ストリーミング・画像読み込み・復元）、最下部付近にいる場合だけ追従する
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) scrollToBottom(false);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const jumpToLatest = () => {
    stickRef.current = true;
    setShowJump(false);
    scrollToBottom(true);
  };

  // ── 操作 ──
  const send = (text: string) => {
    // 自分が送ったときは最下部に戻す
    stickRef.current = true;
    sendMessage({ text });
  };

  const pickSlot = (label: string) => {
    if (status === "ready") send(label);
  };

  const submitMessage = () => {
    send(input);
    setInput("");
  };

  const resetConversation = () => {
    stop();
    clearError();
    setMessages([]);
    setTimestamps({});
    setInput("");
    clearChat();
    stickRef.current = true;
    setShowJump(false);
  };

  const errorText =
    error?.message && error.message !== "An error occurred."
      ? error.message
      : "エラーが発生しました。少し時間をおいて、もう一度お試しください。";
  const canRetry = !error?.message.includes(QUOTA_EXCEEDED_TEXT);

  return (
    // ヘッダーを除いた画面の高さいっぱい。dvhでスマホのアドレスバー・キーボードの伸縮に追従する
    <main className="h-[calc(100dvh-var(--site-header-h))] w-full bg-gray-50">
      <div className="mx-auto flex h-full max-w-3xl flex-col border-gray-200 bg-white sm:border-x">
        <ChatHeader canReset={messages.length > 0} onReset={resetConversation} />
        <ProgressStepper messages={messages} />

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="みらいくんとの会話"
            onScroll={handleScroll}
            className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
          >
            <div ref={contentRef} className="flex flex-col gap-3">
              <ConversationProvider messages={messages}>
                {messages.length === 0 && <WelcomeMessage onPickExample={send} />}
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    timestamp={timestamps[message.id]}
                    onPickSlot={pickSlot}
                    onApprovalResponse={addToolApprovalResponse}
                  />
                ))}
              </ConversationProvider>
              {status === "submitted" && <TypingIndicator />}
              {error && (
                <div className="flex flex-col items-start gap-2 self-start rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  <p>{errorText}</p>
                  {canRetry && (
                    <button
                      type="button"
                      aria-label="もう一度試す"
                      className="cursor-pointer rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-bold hover:bg-red-100"
                      onClick={() => {
                        stickRef.current = true;
                        clearError();
                        regenerate();
                      }}
                    >
                      もう一度試す
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {showJump && (
            <button
              type="button"
              aria-label="最新のメッセージへ移動"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-brand-navy shadow-md hover:bg-gray-50"
              onClick={jumpToLatest}
            >
              ↓ 最新のメッセージへ
            </button>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <ChatComposer
            input={input}
            setInput={setInput}
            onSubmit={submitMessage}
            onStop={() => void stop()}
            busy={busy}
          />
        </div>
      </div>
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

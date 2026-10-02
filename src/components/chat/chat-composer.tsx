"use client";

import { useEffect, useRef } from "react";
import { SendIcon } from "@/components/icons";

export function ChatComposer({
  input,
  setInput,
  onSubmit,
  onStop,
  busy,
}: {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  // 応答中は入力はできるが、送信は止めて「停止」ボタンに切り替える
  busy: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textareaの高さをコンテンツに合わせて自動調整する（最大160pxまで、以降はスクロール）
  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
  // 入力欄の外から値が変わった場合（新しい会話・プレフィル）にも高さを合わせる
  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current);
  }, [input]);

  const submitMessage = () => {
    if (input.trim() && !busy) {
      onSubmit();
      // ボタン押下で外れたフォーカスを入力欄に戻す
      textareaRef.current?.focus();
    }
  };

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submitMessage();
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="max-h-40 flex-1 resize-none rounded-lg border border-gray-300 p-2 text-sm focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30 focus:outline-none"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          resizeTextarea(e.target);
        }}
        onKeyDown={(e) => {
          // IMEの変換確定のEnterでは送信しない（keyCode 229はSafari対策）
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
          }
        }}
        aria-label="メッセージを入力"
        placeholder="メッセージを入力…（Shift+Enterで改行）"
      />
      {busy ? (
        <button
          type="button"
          aria-label="停止"
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gray-700 px-4 text-sm font-bold text-white transition-colors hover:bg-gray-900"
          onClick={onStop}
        >
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-white" />
          停止
        </button>
      ) : (
        <button
          type="submit"
          aria-label="送信"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-teal text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!input.trim()}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      )}
    </form>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { SendIcon } from "@/components/icons";

export function ChatComposer({
  input,
  setInput,
  onSubmit,
  disabled,
}: {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textareaの高さをコンテンツに合わせて自動調整する（最大160pxまで、以降はスクロール）
  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current);
  }, []);

  const submitMessage = () => {
    if (input.trim() && !disabled) {
      onSubmit();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
          }
        }}
        disabled={disabled}
        placeholder="メッセージを入力…（Shift+Enterで改行）"
      />
      <button
        type="submit"
        aria-label="送信"
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-teal text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || !input.trim()}
      >
        <SendIcon className="h-5 w-5" />
      </button>
    </form>
  );
}

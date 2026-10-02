"use client";

import Image from "next/image";
import { useState } from "react";

export function ChatHeader({
  canReset,
  onReset,
}: {
  canReset: boolean;
  onReset: () => void;
}) {
  // 確認なしで会話が消えると事故になるため、その場で確認を挟む
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 py-2 sm:px-6">
      <Image
        src="/miraikun.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight font-bold">みらいくん</p>
        <p className="truncate text-xs text-gray-500">住まい探しのご相談、お気軽にどうぞ</p>
      </div>
      {confirming ? (
        <div role="group" aria-label="会話の消去の確認" className="flex items-center gap-2">
          <span className="hidden text-xs text-gray-700 xs:inline">会話を消去しますか？</span>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            onClick={() => {
              setConfirming(false);
              onReset();
            }}
          >
            消去する
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            onClick={() => setConfirming(false)}
          >
            キャンセル
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="新しい会話を始める"
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canReset}
          onClick={() => setConfirming(true)}
        >
          新しい会話
        </button>
      )}
    </div>
  );
}

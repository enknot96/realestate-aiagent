"use client";

import { useRef, useState } from "react";
import { ACCEPTED_IMAGE_TYPES } from "./validation";

type Props = {
  onSelect: (file: File) => void;
  disabled?: boolean;
};

// ドラッグ＆ドロップとファイル選択の両方に対応した、画像の選択エリア
export function ImageDropzone({ onSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onSelect(file);
      }}
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
        dragging ? "border-brand-teal bg-brand-teal/10" : "border-gray-300 bg-gray-50"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-10 w-10 text-brand-teal"
        aria-hidden="true"
      >
        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </svg>
      <p className="text-sm font-bold text-brand-navy">物件資料の画像をドラッグ＆ドロップ</p>
      <p className="text-xs text-gray-500">JPEG / PNG / WebP・20MBまで（大きい画像は自動で縮小します）</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border border-brand-teal bg-white px-4 py-2 text-sm font-bold text-brand-teal hover:bg-brand-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        ファイルを選択
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          // 同じファイルを選び直しても change が発火するようにする
          e.target.value = "";
        }}
      />
    </div>
  );
}

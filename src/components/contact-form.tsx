"use client";

import { useState } from "react";

// 送信ボタンはUIのみ。実際のメール送信・DB保存は今回のスコープ外のため、
// クライアント側の状態切り替えのみで完了メッセージを表示する
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-6 text-center text-sm text-gray-700">
        <p className="font-bold">お問い合わせを送信しました。</p>
        <p className="mt-1">担当者より折り返しご連絡いたします。</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-bold text-gray-700">お名前</span>
        <input
          name="name"
          type="text"
          required
          className="rounded border border-gray-300 p-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-bold text-gray-700">メールアドレス</span>
        <input
          name="email"
          type="email"
          required
          className="rounded border border-gray-300 p-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-bold text-gray-700">お問い合わせ内容</span>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded border border-gray-300 p-2"
        />
      </label>
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-brand-teal px-4 py-2 font-bold text-white hover:bg-brand-navy"
      >
        送信する
      </button>
    </form>
  );
}

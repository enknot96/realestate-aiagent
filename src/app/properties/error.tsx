"use client";

import Link from "next/link";
import { useEffect } from "react";

// 予期しない例外用。Next.js 16 では再試行関数の props 名は reset ではなく unstable_retry
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-xl font-bold">問題が発生しました</h1>
      <p className="text-sm text-gray-600">
        物件の表示中にエラーが発生しました。時間をおいて再度お試しください。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="cursor-pointer rounded bg-brand-teal px-4 py-1.5 text-white hover:bg-brand-navy"
        >
          もう一度試す
        </button>
        <Link href="/properties" className="text-brand-teal underline hover:text-brand-navy">
          物件一覧へ
        </Link>
        <Link href="/" className="text-brand-teal underline hover:text-brand-navy">
          ホームへ
        </Link>
      </div>
    </main>
  );
}

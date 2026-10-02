import Link from "next/link";
import { ArrowRightIcon, SendIcon } from "@/components/icons";
import { EXAMPLE_PROMPTS } from "@/lib/example-prompts";

// ヒーロー用の入口。GETフォームなのでJS無効でも /chat?ask=... に遷移し、入力欄にプレフィルされる（自動送信はしない）
export function HeroChatEntry() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <form
        action="/chat"
        method="get"
        className="flex w-full items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-lg focus-within:ring-2 focus-within:ring-brand-mint"
      >
        <label htmlFor="hero-ask" className="sr-only">
          みらいくんへのメッセージ
        </label>
        <input
          id="hero-ask"
          type="text"
          name="ask"
          required
          autoComplete="off"
          placeholder="みらいくんに話しかける…"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="みらいくんに送る"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white hover:bg-brand-navy"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </form>

      <ul className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <Link
              href={`/chat?ask=${encodeURIComponent(prompt)}`}
              className="block rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-white/30"
            >
              {prompt}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/properties"
        className="group flex items-center gap-1 text-sm font-bold text-white underline-offset-4 hover:underline"
      >
        条件を指定して探す
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

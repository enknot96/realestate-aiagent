import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";

// 404ページ共通の表示。ブランドカラーのグラデーション帯＋みらいくんで、迷子になった先の導線を示す
export function NotFoundView({
  title,
  message,
  showHome = false,
}: {
  title: string;
  message: string;
  showHome?: boolean;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 p-6 py-16 text-center">
      <div className="brand-gradient h-1 w-24 rounded-full" aria-hidden="true" />
      <Image
        src="/miraikun.png"
        alt=""
        width={96}
        height={96}
        className="h-24 w-24 rounded-full object-cover"
      />
      <div>
        <p className="brand-gradient-text text-4xl font-bold">404</p>
        <h1 className="mt-2 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex w-full flex-col gap-2 xs:w-auto xs:flex-row">
        {showHome && (
          <Link
            href="/"
            className="flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-brand-teal hover:text-brand-teal"
          >
            ホームへ
          </Link>
        )}
        <Link
          href="/properties"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-teal bg-white px-5 py-3 text-sm font-bold text-brand-teal hover:bg-brand-teal/10"
        >
          <SearchIcon className="h-4 w-4" />
          物件を探す
        </Link>
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-5 py-3 text-sm font-bold text-white hover:bg-brand-navy"
        >
          <Image
            src="/miraikun.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
          みらいくんに相談する
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

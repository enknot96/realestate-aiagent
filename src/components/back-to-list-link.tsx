"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";

// 直前のページが同一オリジンの /properties（一覧）かどうか。
// Next.jsのクライアント遷移ではdocument.referrerが初回読み込み時のまま更新されないため、
// 使える環境ではNavigation APIの履歴エントリを優先し、なければreferrerで判定する
function cameFromPropertyList(): boolean {
  const isList = (url: string) => {
    try {
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.replace(/\/$/, "") === "/properties";
    } catch {
      return false;
    }
  };

  const nav = (
    window as unknown as {
      navigation?: { currentEntry?: { index: number } | null; entries(): { url: string | null }[] };
    }
  ).navigation;
  if (nav?.currentEntry) {
    const prev = nav.entries()[nav.currentEntry.index - 1];
    return !!prev?.url && isList(prev.url);
  }

  return !!document.referrer && isList(document.referrer);
}

// 一覧から来た場合は router.back() で検索条件・ページ位置を保ったまま戻る。
// それ以外（直リンク・チャットから新規タブ等）は通常のリンクとして /properties へ遷移する
export function BackToListLink({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Link
      href="/properties"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (cameFromPropertyList()) {
          e.preventDefault();
          router.back();
        }
      }}
      className={
        className ??
        "group flex w-fit items-center gap-1 text-sm font-bold text-brand-teal hover:text-brand-navy"
      }
    >
      <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
      物件一覧に戻る
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAT_ITEM } from "@/lib/nav";

export function ChatFab() {
  const pathname = usePathname();

  // /chat 自体と物件詳細(スマホ下部の固定CTAと重なる)では出さない。/properties 一覧は対象
  if (pathname === CHAT_ITEM.href || pathname.startsWith("/properties/")) return null;

  return (
    <Link
      href={CHAT_ITEM.href}
      aria-label="みらいくんに相談する"
      className="animate-fab-in fixed right-4 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg transition-shadow hover:shadow-xl sm:right-6 sm:py-1.5 sm:pr-4 sm:pl-1.5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Image
        src="/miraikun.png"
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
      <span className="hidden text-sm font-bold text-brand-navy sm:inline">みらいくんに相談</span>
    </Link>
  );
}

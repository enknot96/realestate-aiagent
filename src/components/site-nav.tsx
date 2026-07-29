"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/concept", label: "みらい不動産について" },
  { href: "/company", label: "会社概要" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/properties", label: "物件を探す" },
];

const CHAT_ITEM = { href: "/chat", label: "みらいくんに相談する" };

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative w-fit py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-brand-teal after:transition-transform after:duration-300 after:content-[''] ${
        active
          ? "font-bold text-brand-teal after:scale-x-100"
          : "text-gray-600 after:scale-x-0 hover:text-brand-teal hover:after:scale-x-100"
      }`}
    >
      {label}
    </Link>
  );
}

function ChatLink({ active, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={CHAT_ITEM.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
        active
          ? "border-brand-teal bg-brand-teal/10 font-bold text-brand-teal"
          : "border-gray-300 text-gray-600 hover:border-brand-teal hover:text-brand-teal"
      }`}
    >
      <Image
        src="/miraikun.png"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover"
      />
      {CHAT_ITEM.label}
    </Link>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-5 text-sm lg:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname === item.href}
          />
        ))}
        <ChatLink active={pathname === CHAT_ITEM.href} />
      </nav>

      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:border-brand-teal hover:text-brand-teal lg:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-gray-200 bg-white px-6 py-4 shadow-md lg:hidden">
          <nav className="flex flex-col items-start gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
                onClick={() => setOpen(false)}
              />
            ))}
            <ChatLink active={pathname === CHAT_ITEM.href} onClick={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  );
}

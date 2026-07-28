"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/concept", label: "みらい不動産について" },
  { href: "/company", label: "会社概要" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/properties", label: "物件を探す" },
  { href: "/chat", label: "みらいくんに相談する" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "font-bold text-brand-teal"
                : "text-gray-600 hover:text-brand-teal"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

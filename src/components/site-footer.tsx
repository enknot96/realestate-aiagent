"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAT_ITEM, NAV_ITEMS } from "@/lib/nav";

export function SiteFooter() {
  const pathname = usePathname();

  // /chat は全画面のアプリ型レイアウトのため、フッターは出さない
  if (pathname === CHAT_ITEM.href) return null;

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="brand-gradient h-1" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr_1.4fr] md:gap-12">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/logo-full.png"
              alt="みらい不動産"
              width={1024}
              height={350}
              className="h-12 w-auto"
            />
          </Link>
          <p className="mt-3 text-sm font-medium text-brand-navy">
            変わる暮らしに、変わらない安心を。
          </p>
        </div>

        <nav aria-label="フッターナビゲーション">
          <h2 className="text-xs font-bold tracking-wider text-gray-500">サイトメニュー</h2>
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {[...NAV_ITEMS, CHAT_ITEM].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block py-1 text-gray-600 hover:text-brand-teal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/tools/property-import"
            className="mt-3 inline-block text-xs text-gray-500 hover:text-brand-teal"
          >
            事業者向け: 物件資料の読み取りデモ
          </Link>
        </nav>

        <div>
          <h2 className="text-xs font-bold tracking-wider text-gray-500">会社情報</h2>
          <dl className="mt-3 space-y-2 text-sm text-gray-600">
            <div>
              <dt className="font-medium text-brand-navy">所在地</dt>
              <dd>兵庫県西宮市みらい町1-2-3 みらいビル 3F</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-navy">免許番号</dt>
              <dd>兵庫県知事 (1) 第102345号</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} みらい不動産株式会社
      </div>
    </footer>
  );
}

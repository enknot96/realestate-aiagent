// ヘッダー(site-nav)とフッターで共有するナビゲーション定義
export const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/concept", label: "みらい不動産について" },
  { href: "/company", label: "会社概要" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/properties", label: "物件を探す" },
];

export const CHAT_ITEM = { href: "/chat", label: "みらいくんに相談する" };

// アクティブ判定: `/` は完全一致、それ以外は配下ページ(/properties/123 等)も前方一致で対象にする
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

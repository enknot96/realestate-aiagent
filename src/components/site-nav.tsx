"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CHAT_ITEM, NAV_ITEMS, isActivePath } from "@/lib/nav";

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
      className={`relative w-fit py-3 after:absolute after:bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-brand-teal after:transition-transform after:duration-300 after:content-[''] ${
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
      className={`flex w-fit items-center gap-1.5 rounded-lg border px-3 py-3 transition-colors ${
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
        className="h-10 w-10 rounded-full object-cover"
      />
      {CHAT_ITEM.label}
    </Link>
  );
}

// 3本線↔️✕のモーフィングアニメーション。中央の線はopacityで消し、上下の線は
// 中央に集めてから回転させることでクロスフェード感のない滑らかなXになる
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span
      className="relative block h-4 w-5"
      aria-hidden="true"
    >
      <span
        className="absolute left-0 top-1/2 h-0.5 w-full rounded-full bg-current transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? "translateY(-50%) rotate(45deg)" : "translateY(calc(-50% - 6px))",
        }}
      />
      <span
        className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ease-in-out"
        style={{ opacity: open ? 0 : 1 }}
      />
      <span
        className="absolute left-0 top-1/2 h-0.5 w-full rounded-full bg-current transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? "translateY(-50%) rotate(-45deg)" : "translateY(calc(-50% + 6px))",
        }}
      />
    </span>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  // ページ遷移したらメニューを閉じる（レンダー中のstate調整）
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // 開いている間だけ Esc / メニュー外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="contents">
      <nav className="hidden items-center gap-5 text-sm lg:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActivePath(pathname, item.href)}
          />
        ))}
        <ChatLink active={isActivePath(pathname, CHAT_ITEM.href)} />
      </nav>

      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-all duration-200 hover:border-brand-teal hover:text-brand-teal active:scale-90 lg:hidden"
      >
        <HamburgerIcon open={open} />
      </button>

      <div
        aria-hidden={!open}
        inert={!open}
        className={`absolute inset-x-0 top-full z-20 grid overflow-hidden border-gray-200 bg-white shadow-md transition-[grid-template-rows,opacity] duration-300 ease-in-out lg:hidden ${
          open
            ? "grid-rows-[1fr] border-b opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <nav className="flex min-h-0 flex-col items-start gap-2 px-6 py-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActivePath(pathname, item.href)}
              onClick={() => setOpen(false)}
            />
          ))}
          <ChatLink
            active={isActivePath(pathname, CHAT_ITEM.href)}
            onClick={() => setOpen(false)}
          />
        </nav>
      </div>
    </div>
  );
}

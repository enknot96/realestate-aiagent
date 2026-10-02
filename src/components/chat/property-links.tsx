"use client";

import Link from "next/link";
import { PropertyThumbnail } from "@/components/property";
import { ArrowRightIcon } from "@/components/icons";
import { buildSearchParams, formatPrice, PROPERTY_TYPE_LABEL } from "@/lib/property";
import type { PropertySearchConditions } from "@/lib/property";
import type { ConversationProperty } from "./types";

function typeBadge(type: string | undefined) {
  if (type !== "rent" && type !== "sale") return null;
  return (
    <span
      className={`absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-bold text-white shadow-sm ${
        type === "rent" ? "bg-brand-teal" : "bg-brand-navy"
      }`}
    >
      {PROPERTY_TYPE_LABEL[type]}
    </span>
  );
}

function specText(p: ConversationProperty): string {
  return `${p.layout ?? "-"}${p.area ? ` / ${p.area}㎡` : ""}`;
}

function asType(type: string | undefined) {
  return type === "rent" || type === "sale" ? type : undefined;
}

// 検索結果のミニ物件カード列（横スクロール）。
// 会話は sessionStorage に保存されるので、物件ページは同じタブで開く（戻ると会話が復元される）
export function PropertyCardRow({
  properties,
  total,
  searchInput,
}: {
  properties: ConversationProperty[];
  total: number;
  searchInput: Record<string, unknown>;
}) {
  if (properties.length === 0) return null;

  const hiddenCount = total - properties.length;
  const conditions: PropertySearchConditions = {
    type: searchInput.type === "rent" || searchInput.type === "sale" ? searchInput.type : undefined,
    minPrice: typeof searchInput.minPrice === "number" ? searchInput.minPrice : undefined,
    maxPrice: typeof searchInput.maxPrice === "number" ? searchInput.maxPrice : undefined,
    layout: typeof searchInput.layout === "string" ? searchInput.layout : undefined,
    keyword: typeof searchInput.keyword === "string" ? searchInput.keyword : undefined,
  };
  const query = buildSearchParams(conditions).toString();
  const listHref = query ? `/properties?${query}` : "/properties";

  return (
    // min-w-0 とカード列側の overflow-x-auto で、ページ全体ではなくこの列だけが横スクロールする
    <ul className="-mx-1 mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
      {properties.map((p) => (
        <li key={p.id} className="w-44 shrink-0 snap-start sm:w-48">
          <Link
            href={`/properties/${p.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <PropertyThumbnail property={{ imageUrl: p.imageUrl, title: p.title ?? "物件" }} />
              {typeBadge(p.type)}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 p-2.5">
              <h3 className="line-clamp-2 text-xs font-bold">{p.title}</h3>
              {typeof p.price === "number" && (
                <p className="text-sm font-bold text-brand-teal">{formatPrice(p.price, asType(p.type))}</p>
              )}
              <p className="text-[11px] text-gray-500">{specText(p)}</p>
              <p className="truncate text-[11px] text-gray-500">{p.address}</p>
            </div>
          </Link>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="w-36 shrink-0 snap-start">
          <Link
            href={listHref}
            className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-teal/50 bg-brand-teal/5 p-3 text-center text-xs font-bold text-brand-teal hover:bg-brand-teal/10"
          >
            ほか{hiddenCount}件を一覧で見る
            <ArrowRightIcon />
          </Link>
        </li>
      )}
    </ul>
  );
}

// 物件詳細（getPropertyDetail）の大きめカード
export function PropertyDetailCard({ property: p }: { property: ConversationProperty }) {
  return (
    <Link
      href={`/properties/${p.id}`}
      className="mt-3 flex max-w-sm flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <PropertyThumbnail property={{ imageUrl: p.imageUrl, title: p.title ?? "物件" }} />
        {typeBadge(p.type)}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold">{p.title}</h3>
        {typeof p.price === "number" && (
          <p className="text-lg font-bold text-brand-teal">{formatPrice(p.price, asType(p.type))}</p>
        )}
        <p className="text-xs text-gray-500">{specText(p)}</p>
        <p className="text-xs text-gray-500">{p.address}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-teal">
          物件ページを見る
          <ArrowRightIcon className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

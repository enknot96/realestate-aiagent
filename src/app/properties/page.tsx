import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { realestateApiFetch } from "@/lib/realestateApi";
import { PropertyCard } from "@/components/property";
import { PropertySearchForm } from "@/components/property-search-form";
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "@/components/icons";
import {
  buildSearchParams,
  buildZeroResultsQuestion,
  conditionChips,
  parseSearchConditions,
  type PropertyListResponse,
  type PropertySearchConditions,
} from "@/lib/property";

export const metadata: Metadata = {
  title: "物件を探す | みらい不動産",
};

const LIMIT = 20;

type SearchParams = {
  type?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  layout?: string | string[];
  keyword?: string | string[];
  offset?: string | string[];
};

// offset が負数・非数値なら 0 扱い
function parseOffset(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function listHref(conditions: PropertySearchConditions, offset = 0) {
  const params = buildSearchParams(conditions);
  if (offset > 0) params.set("offset", String(offset));
  const qs = params.toString();
  return qs ? `/properties?${qs}` : "/properties";
}

// 1 と最終ページ、現在ページの前後2ページを残し、間は null（省略記号）にする
function pageNumbers(current: number, last: number): (number | null)[] {
  const pages: (number | null)[] = [];
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || Math.abs(p - current) <= 2) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null);
    }
  }
  return pages;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const conditions = parseSearchConditions(sp);
  const offset = parseOffset(sp.offset);
  const query = buildSearchParams(conditions);
  query.set("offset", String(offset));
  query.set("limit", String(LIMIT));

  let data: PropertyListResponse | null = null;
  try {
    data = await realestateApiFetch<PropertyListResponse>(`/properties?${query.toString()}`);
  } catch {
    // ④が一時的に落ちていても一覧ページ自体は表示する（0件とは区別してエラー表示にする）
  }

  const chips = conditionChips(conditions);
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <SearchIcon className="h-5 w-5 text-brand-teal" />
        物件を探す
      </h1>

      <PropertySearchForm initial={conditions} variant="full" />

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-sm" aria-label="適用中の条件">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Link
                href={listHref({ ...conditions, [chip.key]: undefined })}
                aria-label={`${chip.label}の条件を外す`}
                className="flex items-center gap-1 rounded-full border border-brand-teal/40 bg-brand-teal/5 py-0.5 pr-2 pl-3 text-brand-teal hover:bg-brand-teal/10"
              >
                {chip.label}
                <span aria-hidden="true" className="text-base leading-none">
                  ×
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data === null ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700"
        >
          物件情報を取得できませんでした。時間をおいて再度お試しください。
        </p>
      ) : (
        <>
          {data.total > 0 && data.properties.length > 0 && (
            <p className="text-sm text-gray-500">
              全{data.total}件中 {offset + 1}〜{offset + data.properties.length}件を表示
            </p>
          )}

          {data.total === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              <p>
                条件に一致する物件が見つかりませんでした。AIエージェントに相談すると、条件を緩めた提案がもらえます。
              </p>
              <Link
                href={`/chat?ask=${encodeURIComponent(buildZeroResultsQuestion(conditions))}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-6 py-3 font-bold text-white hover:bg-brand-navy"
              >
                <Image
                  src="/miraikun.png"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
                この条件についてみらいくんに相談する
              </Link>
            </div>
          ) : data.properties.length === 0 ? (
            // offset が総件数を超えている場合
            <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              このページには表示できる物件がありません。
              <Link href={listHref(conditions)} className="text-brand-teal underline">
                1ページ目へ戻る
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="ページ送り"
              className="flex flex-wrap items-center justify-center gap-1 text-sm"
            >
              {currentPage > 1 && (
                <Link
                  href={listHref(conditions, Math.max(0, offset - LIMIT))}
                  className="group mr-2 flex items-center gap-1 font-bold text-brand-teal hover:text-brand-navy"
                >
                  <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  前へ
                </Link>
              )}
              {pageNumbers(currentPage, totalPages).map((p, i) =>
                p === null ? (
                  <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden="true">
                    …
                  </span>
                ) : p === currentPage ? (
                  <span
                    key={p}
                    aria-current="page"
                    className="min-w-8 rounded bg-brand-teal px-2 py-1 text-center font-bold text-white"
                  >
                    {p}
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={listHref(conditions, (p - 1) * LIMIT)}
                    aria-label={`${p}ページ目`}
                    className="min-w-8 rounded px-2 py-1 text-center text-brand-teal hover:bg-brand-teal/10"
                  >
                    {p}
                  </Link>
                ),
              )}
              {offset + LIMIT < data.total && (
                <Link
                  href={listHref(conditions, offset + LIMIT)}
                  className="group ml-2 flex items-center gap-1 font-bold text-brand-teal hover:text-brand-navy"
                >
                  次へ
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { realestateApiFetch } from "@/lib/realestateApi";
import { PropertyCard } from "@/components/property";
import type { PropertyListResponse } from "@/lib/property";

export const metadata: Metadata = {
  title: "物件を探す | みらい不動産",
};

const LIMIT = 20;

type SearchParams = {
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  layout?: string;
  keyword?: string;
  offset?: string;
};

function buildQuery(searchParams: SearchParams, offset: number) {
  const params = new URLSearchParams();
  if (searchParams.type) params.set("type", searchParams.type);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
  if (searchParams.layout) params.set("layout", searchParams.layout);
  if (searchParams.keyword) params.set("keyword", searchParams.keyword);
  params.set("offset", String(offset));
  return params;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const offset = Number(sp.offset ?? "0") || 0;
  const query = buildQuery(sp, offset);
  query.set("limit", String(LIMIT));

  let data: PropertyListResponse;
  try {
    data = await realestateApiFetch<PropertyListResponse>(`/properties?${query.toString()}`);
  } catch {
    // ④が一時的に落ちていても一覧ページ自体は表示する（0件として扱う）
    data = { properties: [], total: 0, limit: LIMIT, offset };
  }

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < data.total;

  function pageHref(newOffset: number) {
    const p = buildQuery(sp, newOffset);
    return `/properties?${p.toString()}`;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">物件を探す</h1>

      <form className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
        <select
          name="type"
          defaultValue={sp.type ?? ""}
          className="rounded border border-gray-300 p-1.5"
        >
          <option value="">種別: 指定なし</option>
          <option value="rent">賃貸</option>
          <option value="sale">売買</option>
        </select>
        <input
          name="minPrice"
          type="number"
          placeholder="下限価格"
          defaultValue={sp.minPrice}
          className="w-28 rounded border border-gray-300 p-1.5"
        />
        <input
          name="maxPrice"
          type="number"
          placeholder="上限価格"
          defaultValue={sp.maxPrice}
          className="w-28 rounded border border-gray-300 p-1.5"
        />
        <input
          name="layout"
          type="text"
          placeholder="間取り (例: 2LDK)"
          defaultValue={sp.layout}
          className="w-32 rounded border border-gray-300 p-1.5"
        />
        <input
          name="keyword"
          type="text"
          placeholder="キーワード (例: ペット可)"
          defaultValue={sp.keyword}
          className="w-40 rounded border border-gray-300 p-1.5"
        />
        <button type="submit" className="rounded bg-brand-teal px-4 py-1.5 text-white hover:bg-brand-navy">
          検索
        </button>
      </form>

      <p className="text-sm text-gray-500">
        {data.total}件中 {data.properties.length}件を表示
      </p>

      {data.properties.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          条件に一致する物件が見つかりませんでした。AIエージェントに相談すると、条件を緩めた提案がもらえます。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <div className="flex justify-between text-sm">
        {hasPrev ? (
          <Link href={pageHref(Math.max(0, offset - LIMIT))} className="text-brand-teal">
            ← 前へ
          </Link>
        ) : (
          <span />
        )}
        {hasNext ? (
          <Link href={pageHref(offset + LIMIT)} className="text-brand-teal">
            次へ →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}

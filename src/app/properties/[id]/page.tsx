import { cache, Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { realestateApiFetch, RealestateApiError } from "@/lib/realestateApi";
import { PropertyThumbnail } from "@/components/property";
import { BackToListLink } from "@/components/back-to-list-link";
import { PropertyConsultCta } from "@/components/property-cta";
import { SimilarProperties } from "@/components/similar-properties";
import { formatPrice, PROPERTY_TYPE_LABEL, type PropertyDetail } from "@/lib/property";

// 正の整数のみ許可（"abc"・"-1"・"1.5"・"01" などはAPIを呼ばずに404）
function parseId(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

// generateMetadataとページ本体で同じ物件を二重に取得しないよう、リクエスト内でキャッシュする
const getProperty = cache(async (id: number): Promise<PropertyDetail | null> => {
  try {
    return await realestateApiFetch<PropertyDetail>(`/properties/${id}`);
  } catch (error) {
    if (error instanceof RealestateApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = parseId((await params).id);
  const property = id === null ? null : await getProperty(id);
  if (!property) {
    return { title: "物件が見つかりません | みらい不動産" };
  }

  const title = `${property.title} | みらい不動産`;
  const description = property.description?.replace(/\s+/g, " ").trim().slice(0, 100) || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: property.imageUrl ? [property.imageUrl] : undefined,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseId((await params).id);
  if (id === null) notFound();

  const property = await getProperty(id);
  if (!property) notFound();

  const overview: { label: string; value: string }[] = [
    { label: "種別", value: PROPERTY_TYPE_LABEL[property.type] },
    { label: "価格", value: formatPrice(property.price, property.type) },
    { label: "間取り", value: property.layout ?? "-" },
    { label: "専有面積", value: property.area ? `${property.area}㎡` : "-" },
    { label: "所在地", value: property.address || "-" },
  ];

  return (
    // 下部固定CTAバー（スマホ）はmain末尾のstickyで実現し、フッターに重ならないようにする
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <nav aria-label="パンくず" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="hover:text-brand-teal">
              ホーム
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link href="/properties" className="hover:text-brand-teal">
              物件を探す
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page" className="min-w-0 truncate text-gray-700">
            {property.title}
          </li>
        </ol>
      </nav>

      <BackToListLink />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg lg:col-start-1">
          <PropertyThumbnail property={property} />
        </div>

        <aside className="flex flex-col gap-3 self-start rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <span className="w-fit rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-bold text-brand-teal">
            {PROPERTY_TYPE_LABEL[property.type]}
          </span>
          <h1 className="text-xl font-bold">{property.title}</h1>
          <p className="text-2xl font-bold text-brand-teal">{formatPrice(property.price, property.type)}</p>
          <ul className="flex flex-col gap-1 border-t border-gray-100 pt-3 text-sm text-gray-700">
            <li>間取り: {property.layout ?? "-"}</li>
            <li>専有面積: {property.area ? `${property.area}㎡` : "-"}</li>
            <li>所在地: {property.address || "-"}</li>
          </ul>
          <PropertyConsultCta title={property.title} className="hidden lg:flex" />
        </aside>

        <section className="lg:col-start-1">
          <h2 className="mb-2 text-lg font-bold">物件概要</h2>
          <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-sm">
            {overview.map((item) => (
              <div key={item.label} className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3">
                <dt className="text-gray-500">{item.label}</dt>
                <dd className="min-w-0 break-words">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {property.description && (
          <section className="lg:col-start-1">
            <h2 className="mb-2 text-lg font-bold">物件の特徴・説明</h2>
            <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm">
              {property.description}
            </p>
          </section>
        )}
      </div>

      <Suspense fallback={null}>
        <SimilarProperties property={property} />
      </Suspense>

      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 border-t border-gray-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <PropertyConsultCta title={property.title} className="flex-row [&>a]:flex-1 [&>a]:px-2" />
      </div>
    </main>
  );
}

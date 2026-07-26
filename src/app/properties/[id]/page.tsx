import Link from "next/link";
import { notFound } from "next/navigation";
import { realestateApiFetch, RealestateApiError } from "@/lib/realestateApi";
import { PropertyThumbnail } from "@/components/property";
import { formatPrice, PROPERTY_TYPE_LABEL, type PropertyDetail } from "@/lib/property";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let property: PropertyDetail;
  try {
    property = await realestateApiFetch<PropertyDetail>(`/properties/${id}`);
  } catch (error) {
    if (error instanceof RealestateApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const askText = `「${property.title}」について、内見の相談をしたいです`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <Link href="/properties" className="text-sm text-blue-600">
        ← 物件一覧に戻る
      </Link>

      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
        <PropertyThumbnail property={property} />
      </div>

      <div>
        <span className="text-xs text-gray-500">{PROPERTY_TYPE_LABEL[property.type]}</span>
        <h1 className="text-xl font-bold">{property.title}</h1>
        <p className="mt-1 text-2xl font-bold text-blue-700">{formatPrice(property.price)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">間取り</dt>
          <dd>{property.layout ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">面積</dt>
          <dd>{property.area ? `${property.area}㎡` : "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">住所</dt>
          <dd>{property.address}</dd>
        </div>
      </dl>

      {property.description && (
        <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm">
          {property.description}
        </p>
      )}

      <Link
        href={`/?ask=${encodeURIComponent(askText)}`}
        className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white"
      >
        この物件についてAIエージェントに相談する
      </Link>
    </main>
  );
}

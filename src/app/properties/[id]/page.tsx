import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { realestateApiFetch, RealestateApiError } from "@/lib/realestateApi";
import { PropertyThumbnail } from "@/components/property";
import { ArrowLeftIcon } from "@/components/icons";
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <Link
        href="/properties"
        className="group flex w-fit items-center gap-1 text-sm font-bold text-brand-teal hover:text-brand-navy"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        物件一覧に戻る
      </Link>

      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
        <PropertyThumbnail property={property} />
      </div>

      <div>
        <span className="text-xs text-gray-500">{PROPERTY_TYPE_LABEL[property.type]}</span>
        <h1 className="text-xl font-bold">{property.title}</h1>
        <p className="mt-1 text-2xl font-bold text-brand-teal">{formatPrice(property.price)}</p>
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
        href={`/chat?ask=${encodeURIComponent(askText)}`}
        className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-4 text-center text-sm font-bold text-white hover:bg-brand-navy max-[424px]:text-[14px]"
      >
        <Image
          src="/miraikun.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
        この物件についてみらいくんに相談する
      </Link>
    </main>
  );
}

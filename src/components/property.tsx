import Link from "next/link";
import { formatPrice, PROPERTY_TYPE_LABEL, type PropertySummary } from "@/lib/property";

// ④が画像未対応の間・画像未アップロードの物件は imageUrl が null/undefined で届く。
// その場合はプレースホルダーを表示する（本物の画像が入り次第、自動で切り替わる）
export function PropertyThumbnail({
  property,
}: {
  property: Pick<PropertySummary, "imageUrl" | "title">;
}) {
  if (property.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Vercel Blobのホスト名が動的なためnext/imageの許可リスト設定を避ける
      <img
        src={property.imageUrl}
        alt={property.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
      画像準備中
    </div>
  );
}

export function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full">
        <PropertyThumbnail property={property} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs text-gray-500">{PROPERTY_TYPE_LABEL[property.type]}</span>
        <h3 className="line-clamp-2 text-sm font-bold">{property.title}</h3>
        <p className="text-base font-bold text-blue-700">{formatPrice(property.price)}</p>
        <p className="text-xs text-gray-500">
          {property.layout ?? "-"}
          {property.area ? ` / ${property.area}㎡` : ""}
        </p>
        <p className="mt-auto text-xs text-gray-500">{property.address}</p>
      </div>
    </Link>
  );
}

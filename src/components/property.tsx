"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, propertyKindLabel, summarizeSpec, type PropertySummary } from "@/lib/property";

// ④が画像未対応の間・画像未アップロードの物件は imageUrl が null/undefined で届く。
// その場合はプレースホルダーを表示する（本物の画像が入り次第、自動で切り替わる）
export function PropertyThumbnail({
  property,
}: {
  property: Pick<PropertySummary, "imageUrl" | "title">;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (!property.imageUrl || status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
        画像準備中
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" aria-hidden="true" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Vercel Blobのホスト名が動的なためnext/imageの許可リスト設定を避ける */}
      <img
        src={property.imageUrl}
        alt={property.title}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        // ブラウザキャッシュ済みの画像はDOMにアタッチされた時点で既に読み込み完了しており、
        // onLoadが発火しないことがある。ref経由でcompleteを確認して取りこぼしを防ぐ
        ref={(node) => {
          if (node?.complete && node.naturalWidth > 0) {
            setStatus("loaded");
          }
        }}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}

export function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {/* ホバー時のズームはreduced-motionでは無効（motion-safe） */}
        <div className="h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-105">
          <PropertyThumbnail property={property} />
        </div>
        <span
          className={`absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-bold text-white shadow-sm ${
            property.type === "rent" ? "bg-brand-teal" : "bg-brand-navy"
          }`}
        >
          {propertyKindLabel(property)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold">{property.title}</h3>
        <p className="text-base font-bold text-brand-teal">{formatPrice(property.price, property.type)}</p>
        <p className="text-xs text-gray-500">
          {summarizeSpec(property)}
        </p>
        <p className="mt-auto text-xs text-gray-500">{property.address}</p>
      </div>
    </Link>
  );
}

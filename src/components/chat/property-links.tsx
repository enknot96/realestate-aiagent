import type { PropertyLinkItem } from "./types";

export function PropertyLinks({ properties }: { properties: PropertyLinkItem[] }) {
  if (properties.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {properties.map((p) => (
        <a
          key={p.id}
          href={`/properties/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
        >
          {p.title}（{p.price.toLocaleString()}円）↗
        </a>
      ))}
    </div>
  );
}

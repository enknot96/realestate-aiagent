import { realestateApiFetch } from "@/lib/realestateApi";
import { PropertyCard } from "@/components/property";
import type { PropertyDetail, PropertyListResponse, PropertySummary } from "@/lib/property";

const MAX_ITEMS = 4;

async function fetchList(params: Record<string, string>): Promise<PropertySummary[]> {
  const query = new URLSearchParams({ ...params, limit: String(MAX_ITEMS + 1) });
  const data = await realestateApiFetch<PropertyListResponse>(`/properties?${query.toString()}`);
  return data.properties;
}

// 同じ種別＋同じ間取りを優先し、足りなければ同じ種別のみで補完する（自分自身は除外）。
// 取得に失敗してもページ全体は落とさず、セクションごと非表示にする
async function findSimilar(property: PropertyDetail): Promise<PropertySummary[]> {
  const picked: PropertySummary[] = [];
  const add = (list: PropertySummary[]) => {
    for (const p of list) {
      if (p.id === property.id || picked.some((x) => x.id === p.id)) continue;
      if (picked.length < MAX_ITEMS) picked.push(p);
    }
  };

  if (property.layout) {
    add(await fetchList({ type: property.type, layout: property.layout }));
  }
  if (picked.length < MAX_ITEMS) {
    add(await fetchList({ type: property.type }));
  }
  return picked;
}

export async function SimilarProperties({ property }: { property: PropertyDetail }) {
  let similar: PropertySummary[];
  try {
    similar = await findSimilar(property);
  } catch {
    return null;
  }
  if (similar.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">似た物件</h2>
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
        {similar.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

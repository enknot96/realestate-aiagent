// ④APIの物件レスポンス型。imageUrlは④側が画像対応するまではundefined/nullで届く（前方互換）
export type PropertySummary = {
  id: number;
  type: "rent" | "sale";
  title: string;
  description: string | null;
  price: number;
  layout: string | null;
  area: string | null;
  address: string;
  imageUrl?: string | null;
};

export type PropertyDetail = PropertySummary & {
  status: string;
};

export type PropertyListResponse = {
  properties: PropertySummary[];
  total: number;
  limit: number;
  offset: number;
};

export function formatPrice(price: number): string {
  return `${price.toLocaleString()}円`;
}

export const PROPERTY_TYPE_LABEL: Record<PropertySummary["type"], string> = {
  rent: "賃貸",
  sale: "売買",
};

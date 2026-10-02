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

// 万円単位の数値を「8」「8.5」「3,280」形式にする（小数は最大2桁、末尾0は省く）
function formatMan(man: number): string {
  return Number(man.toFixed(2)).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// 不動産サイトの慣習に合わせた万円表記（例: 8万円 / 7.95万円 / 3,280万円 / 1億2,000万円）。
// type === "rent" のときは月額なので末尾に /月 を付ける
export function formatPrice(price: number, type?: PropertySummary["type"]): string {
  const OKU = 100_000_000;
  const MAN = 10_000;
  const oku = Math.floor(price / OKU);
  const restMan = (price - oku * OKU) / MAN;
  let body: string;
  if (oku > 0) {
    // 万円未満の端数が丸めで1万円に繰り上がっても桁が崩れないよう、万円部分だけ別に整形する
    body = restMan > 0 ? `${oku.toLocaleString("en-US")}億${formatMan(restMan)}万円` : `${oku.toLocaleString("en-US")}億円`;
  } else {
    body = `${formatMan(restMan)}万円`;
  }
  return type === "rent" ? `${body}/月` : body;
}

export const PROPERTY_TYPE_LABEL: Record<PropertySummary["type"], string> = {
  rent: "賃貸",
  sale: "売買",
};

// ── 検索条件 ──────────────────────────────────────────────

// 検索フォームの価格プリセット（円単位）。URLのクエリ値は円単位の整数
export const PRICE_PRESETS: Record<PropertySummary["type"], number[]> = {
  rent: [50_000, 60_000, 70_000, 80_000, 90_000, 100_000, 120_000, 150_000, 200_000],
  sale: [20_000_000, 30_000_000, 40_000_000, 50_000_000, 60_000_000, 80_000_000, 100_000_000],
};

export const LAYOUT_OPTIONS = ["1K", "1DK", "1LDK", "2DK", "2LDK", "3LDK", "4LDK", "5DK"];

// 一覧の並び順。APIの sort パラメータの値と一致させる（未指定は id 昇順の「標準」）
export type PropertySort = "newest" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: PropertySort | ""; label: string }[] = [
  { value: "", label: "標準" },
  { value: "newest", label: "新着順" },
  { value: "price_asc", label: "価格の安い順" },
  { value: "price_desc", label: "価格の高い順" },
];

// URLの searchParams を正規化した検索条件。値が不正な項目は undefined（＝未指定）として扱う
export type PropertySearchConditions = {
  type?: PropertySummary["type"];
  minPrice?: number;
  maxPrice?: number;
  layout?: string;
  keyword?: string;
  // 並び順は絞り込み条件ではないので、チップ・0件時の質問文には含めない
  sort?: PropertySort;
};

type RawParam = string | string[] | undefined;

function firstParam(value: RawParam): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function parsePrice(value: RawParam): number | undefined {
  const v = firstParam(value);
  return v && /^\d+$/.test(v) ? Number(v) : undefined;
}

export function parseSearchConditions(raw: {
  type?: RawParam;
  minPrice?: RawParam;
  maxPrice?: RawParam;
  layout?: RawParam;
  keyword?: RawParam;
  sort?: RawParam;
}): PropertySearchConditions {
  const type = firstParam(raw.type);
  const sort = firstParam(raw.sort);
  return {
    type: type === "rent" || type === "sale" ? type : undefined,
    minPrice: parsePrice(raw.minPrice),
    maxPrice: parsePrice(raw.maxPrice),
    layout: firstParam(raw.layout),
    keyword: firstParam(raw.keyword),
    // 不正な値をAPIに送ると422になるため、未知の値は未指定（標準）にする
    sort: sort === "newest" || sort === "price_asc" || sort === "price_desc" ? sort : undefined,
  };
}

// 条件をクエリ文字列にする（未指定の項目は含めない）
export function buildSearchParams(conditions: PropertySearchConditions): URLSearchParams {
  const params = new URLSearchParams();
  if (conditions.type) params.set("type", conditions.type);
  if (conditions.minPrice !== undefined) params.set("minPrice", String(conditions.minPrice));
  if (conditions.maxPrice !== undefined) params.set("maxPrice", String(conditions.maxPrice));
  if (conditions.layout) params.set("layout", conditions.layout);
  if (conditions.keyword) params.set("keyword", conditions.keyword);
  if (conditions.sort) params.set("sort", conditions.sort);
  return params;
}

// 一覧ページの「適用中の条件」チップ用。key は外すときに消す項目
export function conditionChips(
  c: PropertySearchConditions,
): { key: keyof PropertySearchConditions; label: string }[] {
  const chips: { key: keyof PropertySearchConditions; label: string }[] = [];
  if (c.type) chips.push({ key: "type", label: PROPERTY_TYPE_LABEL[c.type] });
  if (c.minPrice !== undefined) chips.push({ key: "minPrice", label: `${formatPrice(c.minPrice, c.type)}〜` });
  if (c.maxPrice !== undefined) chips.push({ key: "maxPrice", label: `〜${formatPrice(c.maxPrice, c.type)}` });
  if (c.layout) chips.push({ key: "layout", label: c.layout });
  if (c.keyword) chips.push({ key: "keyword", label: `「${c.keyword}」` });
  return chips;
}

// 0件時にみらいくんへ渡す質問文（検索条件を自然文にしたもの）
export function buildZeroResultsQuestion(c: PropertySearchConditions): string {
  const priceLabel = c.type === "rent" ? "家賃" : "価格";
  const parts: string[] = [];
  if (c.type) parts.push(PROPERTY_TYPE_LABEL[c.type]);
  if (c.minPrice !== undefined) parts.push(`${priceLabel}${formatPrice(c.minPrice)}以上`);
  if (c.maxPrice !== undefined) parts.push(`${priceLabel}${formatPrice(c.maxPrice)}以下`);
  if (c.layout) parts.push(c.layout);
  if (c.keyword) parts.push(`「${c.keyword}」`);
  if (parts.length === 0) return "おすすめの物件を教えてください";
  return `${parts.join("・")}の条件で探しましたが見つかりませんでした。条件を緩めた提案をお願いします`;
}

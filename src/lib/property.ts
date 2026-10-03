export type SaleKind = "land" | "new_house" | "used_house" | "used_mansion";

export const SALE_KIND_LABEL: Record<SaleKind, string> = {
  land: "売地",
  new_house: "新築戸建",
  used_house: "中古戸建",
  used_mansion: "中古マンション",
};

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
  // 以下は④の売買物件項目の拡張。④が未対応の間は項目ごと無いので、全て省略可能・null許容
  saleKind?: SaleKind | null;
  landArea?: string | null;
  privateRoadArea?: string | null;
  buildingArea?: string | null;
  builtYearMonth?: string | null;
  nearestStation?: string | null;
  walkMinutes?: number | null;
  accessNote?: string | null;
  floorCount?: number | null;
  floorNumber?: number | null;
  balconyArea?: string | null;
  managementFee?: number | null;
  repairReserveFee?: number | null;
  managementType?: string | null;
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

// ── 種別ごとの表示 ────────────────────────────────────────

// 表示用の関数が読む項目だけの型。チャットの ConversationProperty（type が string）も受けられるよう緩くしている
export type PropertyFacts = {
  type?: string;
  price?: number;
  layout?: string | null;
  area?: string | null;
  address?: string;
  saleKind?: string | null;
  landArea?: string | null;
  privateRoadArea?: string | null;
  buildingArea?: string | null;
  builtYearMonth?: string | null;
  nearestStation?: string | null;
  walkMinutes?: number | null;
  accessNote?: string | null;
  floorCount?: number | null;
  floorNumber?: number | null;
  balconyArea?: string | null;
  managementFee?: number | null;
  repairReserveFee?: number | null;
  managementType?: string | null;
};

// 未知の値（④が将来増やした種別など）は null 扱いにする
function knownSaleKind(p: PropertyFacts): SaleKind | null {
  return p.saleKind && p.saleKind in SALE_KIND_LABEL ? (p.saleKind as SaleKind) : null;
}

// 種別の表示名。saleKind があればそれ、無ければ「賃貸」「売買」
export function propertyKindLabel(p: PropertyFacts): string {
  const kind = knownSaleKind(p);
  if (kind) return SALE_KIND_LABEL[kind];
  return p.type === "rent" || p.type === "sale" ? PROPERTY_TYPE_LABEL[p.type] : "";
}

const sqm = (v: string) => `${v}㎡`;

// 面積の要約（一覧カード・チャットのカード用の1行）。値が無ければ空文字
export function summarizeArea(p: PropertyFacts): string {
  switch (knownSaleKind(p)) {
    case "land":
      return p.landArea ? `土地 ${sqm(p.landArea)}` : "";
    case "new_house":
    case "used_house":
      return [p.landArea && `土地 ${sqm(p.landArea)}`, p.buildingArea && `建物 ${sqm(p.buildingArea)}`]
        .filter(Boolean)
        .join(" / ");
    case "used_mansion":
      return p.area ? sqm(p.area) : "";
    default:
      if (!p.area) return "";
      // 種別の無い売買は専有面積と断定しない
      return p.type === "sale" ? `面積 ${sqm(p.area)}` : sqm(p.area);
  }
}

// 一覧カード等の「間取り / 面積」行。どちらも無ければ "-"
export function summarizeSpec(p: PropertyFacts): string {
  return [p.layout, summarizeArea(p)].filter(Boolean).join(" / ") || "-";
}

// 交通。accessNote（バス便など）があれば優先する
export function formatAccess(p: PropertyFacts): string | null {
  if (p.accessNote) return p.accessNote;
  if (p.nearestStation && typeof p.walkMinutes === "number") {
    return `${p.nearestStation}駅 徒歩${p.walkMinutes}分`;
  }
  return null;
}

// "2003-03" → "2003年3月"。形式が違えば null
export function formatBuiltYearMonth(value: string | null | undefined): string | null {
  const m = value?.match(/^(\d{4})-(\d{1,2})$/);
  return m ? `${m[1]}年${Number(m[2])}月` : null;
}

const areaOrDash = (v: string | null | undefined) => (v ? sqm(v) : "-");
const yenPerMonth = (v: number | null | undefined) =>
  typeof v === "number" ? `${v.toLocaleString("en-US")}円/月` : "-";

function formatFloor(p: PropertyFacts): string {
  const { floorNumber, floorCount } = p;
  if (typeof floorNumber === "number" && typeof floorCount === "number") {
    return `${floorNumber}階 / ${floorCount}階建`;
  }
  if (typeof floorNumber === "number") return `${floorNumber}階`;
  if (typeof floorCount === "number") return `${floorCount}階建`;
  return "-";
}

// 私道負担は 0 が「負担なし」、null が不明
function formatPrivateRoad(v: string | null | undefined): string {
  if (!v) return "-";
  return Number(v) === 0 ? "なし" : sqm(v);
}

// 物件詳細ページの「物件概要」の行。種別に対応する行は値が無くても "-" で残す
export function buildOverviewRows(p: PropertyFacts): { label: string; value: string }[] {
  const row = (label: string, value: string) => ({ label, value });
  const built = row("築年月", formatBuiltYearMonth(p.builtYearMonth) ?? "-");
  const layout = row("間取り", p.layout || "-");
  const rows = [
    row("種別", propertyKindLabel(p) || "-"),
    row("価格", typeof p.price === "number" ? formatPrice(p.price, p.type === "rent" ? "rent" : "sale") : "-"),
    row("所在地", p.address || "-"),
    row("交通", formatAccess(p) ?? "-"),
  ];
  switch (knownSaleKind(p)) {
    case "land":
      rows.push(row("土地面積", areaOrDash(p.landArea)), row("私道負担面積", formatPrivateRoad(p.privateRoadArea)));
      break;
    case "new_house":
    case "used_house":
      rows.push(
        layout,
        row("土地面積", areaOrDash(p.landArea)),
        row("建物面積", areaOrDash(p.buildingArea)),
        row("私道負担面積", formatPrivateRoad(p.privateRoadArea)),
        built,
      );
      break;
    case "used_mansion":
      rows.push(
        layout,
        row("専有面積", areaOrDash(p.area)),
        row("バルコニー面積", areaOrDash(p.balconyArea)),
        row("所在階", formatFloor(p)),
        built,
        row("管理費", yenPerMonth(p.managementFee)),
        row("修繕積立金", yenPerMonth(p.repairReserveFee)),
        row("管理形態", p.managementType || "-"),
      );
      break;
    default:
      if (p.type === "sale") {
        rows.push(layout, row("面積", areaOrDash(p.area)));
      } else {
        rows.push(layout, row("専有面積", areaOrDash(p.area)));
        if (p.builtYearMonth) rows.push(built);
      }
  }
  return rows;
}

// ── 検索条件 ──────────────────────────────────────────────

// 検索フォームの価格プリセット（円単位）。URLのクエリ値は円単位の整数
export const PRICE_PRESETS: Record<PropertySummary["type"], number[]> = {
  rent: [50_000, 60_000, 70_000, 80_000, 90_000, 100_000, 120_000, 150_000, 200_000],
  sale: [20_000_000, 30_000_000, 40_000_000, 50_000_000, 60_000_000, 80_000_000, 100_000_000],
};

export const LAYOUT_OPTIONS = ["1K", "1DK", "1LDK", "2DK", "2LDK", "3LDK", "4LDK", "5DK"];

// 一覧の並び順。APIの sort パラメータの値と一致させる（未指定は新着順。新しく掲載した物件を先頭に出す）
export type PropertySort = "newest" | "price_asc" | "price_desc";

export const DEFAULT_SORT: PropertySort = "newest";

export const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "price_asc", label: "価格の安い順" },
  { value: "price_desc", label: "価格の高い順" },
];

// APIに渡す並び順。URLで未指定なら既定（新着順）にする。URLには既定値を載せない
export function sortForApi(conditions: PropertySearchConditions): PropertySort {
  return conditions.sort ?? DEFAULT_SORT;
}

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

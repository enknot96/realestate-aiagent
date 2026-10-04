import type { PropertyDraft } from "@/ai/property-import";
import type { SaleKind } from "@/lib/property";

// 下書きフォームの編集用の状態。数値項目は入力途中の文字列を扱えるよう string で持つ
export type DraftFormState = {
  type: "rent" | "sale" | "";
  saleKind: SaleKind | "";
  title: string;
  price: string;
  layout: string;
  area: string;
  landArea: string;
  privateRoadArea: string;
  buildingArea: string;
  address: string;
  nearestStation: string;
  walkMinutes: string;
  builtYearMonth: string;
  features: string[];
  catchCopy: string;
  description: string;
};

export type DraftFieldKey = keyof DraftFormState;

// 種別によって出し分ける項目（それ以外の項目は常に表示する）
const CONDITIONAL_KEYS = [
  "saleKind",
  "layout",
  "area",
  "landArea",
  "privateRoadArea",
  "buildingArea",
  "builtYearMonth",
] as const satisfies readonly DraftFieldKey[];
type ConditionalKey = (typeof CONDITIONAL_KEYS)[number];

const ROOM_KEYS: ConditionalKey[] = ["layout", "area", "builtYearMonth"];
const HOUSE_KEYS: ConditionalKey[] = ["layout", "landArea", "privateRoadArea", "buildingArea", "builtYearMonth"];
const LAND_KEYS: ConditionalKey[] = ["landArea", "privateRoadArea"];

function isConditionalKey(key: DraftFieldKey): key is ConditionalKey {
  return (CONDITIONAL_KEYS as readonly string[]).includes(key);
}

// 種別ごとに表示する項目。種別や物件種別が分からない間は、読み取れた値を隠さないよう全部出す
export function isFieldVisible(state: Pick<DraftFormState, "type" | "saleKind">, key: DraftFieldKey): boolean {
  if (!isConditionalKey(key)) return true;
  if (key === "saleKind") return state.type !== "rent";
  if (state.type === "rent") return ROOM_KEYS.includes(key);
  if (state.type === "sale") {
    switch (state.saleKind) {
      case "land":
        return LAND_KEYS.includes(key);
      case "new_house":
      case "used_house":
        return HOUSE_KEYS.includes(key);
      case "used_mansion":
        return ROOM_KEYS.includes(key);
    }
  }
  return true;
}

const BUILT_YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// 築年月が realestate-api の形式（YYYY-MM、月は01〜12）か
export function isBuiltYearMonth(value: string): boolean {
  return BUILT_YEAR_MONTH.test(value.trim());
}

// ㎡ の入力から「約38.0坪」の表記を作る（不動産の慣習どおり ㎡×0.3025 で換算）。読めなければ null
export function formatTsubo(squareMeters: string): string | null {
  const n = Number(squareMeters.replace(/,/g, "").trim());
  if (squareMeters.trim() === "" || !Number.isFinite(n) || n <= 0) return null;
  return `約${(n * 0.3025).toFixed(1)}坪`;
}

const str = (v: string | number | null) => (v === null ? "" : String(v));

// realestate-api は駅名を「駅」なしで持つ。モデルが付けてしまった場合に備えて末尾の「駅」を外す
function stripStationSuffix(name: string | null): string {
  return str(name).trim().replace(/駅$/, "");
}

export function toFormState(draft: PropertyDraft): DraftFormState {
  return {
    type: draft.type ?? "",
    saleKind: draft.saleKind ?? "",
    title: str(draft.title),
    price: str(draft.price),
    layout: str(draft.layout),
    area: str(draft.area),
    landArea: str(draft.landArea),
    privateRoadArea: str(draft.privateRoadArea),
    buildingArea: str(draft.buildingArea),
    address: str(draft.address),
    nearestStation: stripStationSuffix(draft.nearestStation),
    walkMinutes: str(draft.walkMinutes),
    builtYearMonth: str(draft.builtYearMonth),
    features: draft.features,
    catchCopy: draft.catchCopy,
    description: draft.description,
  };
}

// 空欄は null、数値として読めない入力も null にする
function toNumber(value: string): number | null {
  const n = Number(value.replace(/,/g, "").trim());
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

function toText(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

// 画面に出す・コピーする下書きJSON（realestate-api の物件作成の項目＋補足項目）。
// 種別に合わず表示していない項目は、入力が残っていても null にする
export function toDraftJson(state: DraftFormState) {
  const shown = (key: DraftFieldKey) => isFieldVisible(state, key);
  const builtYearMonth = state.builtYearMonth.trim();
  return {
    type: state.type === "" ? null : state.type,
    saleKind: shown("saleKind") && state.saleKind !== "" ? state.saleKind : null,
    title: toText(state.title),
    price: toNumber(state.price),
    layout: shown("layout") ? toText(state.layout) : null,
    area: shown("area") ? toNumber(state.area) : null,
    landArea: shown("landArea") ? toNumber(state.landArea) : null,
    privateRoadArea: shown("privateRoadArea") ? toNumber(state.privateRoadArea) : null,
    buildingArea: shown("buildingArea") ? toNumber(state.buildingArea) : null,
    address: toText(state.address),
    nearestStation: toText(state.nearestStation),
    walkMinutes: toNumber(state.walkMinutes),
    // 年だけ（「2002」）など登録できない形式は null にし、フォームで月までの入力を案内する
    builtYearMonth: shown("builtYearMonth") && isBuiltYearMonth(builtYearMonth) ? builtYearMonth : null,
    features: state.features,
    catchCopy: state.catchCopy,
    description: state.description,
  };
}

import type { PropertyDraft } from "@/ai/property-import";

// 下書きフォームの編集用の状態。数値項目は入力途中の文字列を扱えるよう string で持つ
export type DraftFormState = {
  type: "rent" | "sale" | "";
  title: string;
  price: string;
  layout: string;
  area: string;
  address: string;
  nearestStation: string;
  walkMinutes: string;
  builtYear: string;
  features: string[];
  catchCopy: string;
  description: string;
};

export type DraftFieldKey = keyof DraftFormState;

const str = (v: string | number | null) => (v === null ? "" : String(v));

export function toFormState(draft: PropertyDraft): DraftFormState {
  return {
    type: draft.type ?? "",
    title: str(draft.title),
    price: str(draft.price),
    layout: str(draft.layout),
    area: str(draft.area),
    address: str(draft.address),
    nearestStation: str(draft.nearestStation),
    walkMinutes: str(draft.walkMinutes),
    builtYear: str(draft.builtYear),
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

// 画面に出す・コピーする下書きJSON（realestate-api の物件作成の項目＋補足項目）
export function toDraftJson(state: DraftFormState) {
  return {
    type: state.type === "" ? null : state.type,
    title: toText(state.title),
    price: toNumber(state.price),
    layout: toText(state.layout),
    area: toNumber(state.area),
    address: toText(state.address),
    nearestStation: toText(state.nearestStation),
    walkMinutes: toNumber(state.walkMinutes),
    builtYear: toNumber(state.builtYear),
    features: state.features,
    catchCopy: state.catchCopy,
    description: state.description,
  };
}

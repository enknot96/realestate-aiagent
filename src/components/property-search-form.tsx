"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  formatPrice,
  LAYOUT_OPTIONS,
  PRICE_PRESETS,
  PROPERTY_TYPE_LABEL,
  type PropertySearchConditions,
} from "@/lib/property";

type Props = {
  // URLの searchParams を正規化した初期値
  initial?: PropertySearchConditions;
  // compact: ホーム用 / full: 一覧用（条件クリアのリンク付き）
  variant?: "compact" | "full";
};

const selectClass = "w-full rounded border border-gray-300 bg-white p-1.5";

// プリセットに無い値（AIが作ったURL等）が来ても選択状態で表示できるよう、選択肢に追加する
function PriceOptions({
  type,
  current,
}: {
  type: PropertySearchConditions["type"];
  current: number | undefined;
}) {
  const allPresets = [...PRICE_PRESETS.rent, ...PRICE_PRESETS.sale];
  const extra = current !== undefined && !allPresets.includes(current) ? current : undefined;
  const groups = type ? [type] : (["rent", "sale"] as const);

  return (
    <>
      <option value="">指定なし</option>
      {extra !== undefined && <option value={extra}>{formatPrice(extra, type)}</option>}
      {groups.map((g) => {
        const options = PRICE_PRESETS[g].map((v) => (
          <option key={v} value={v}>
            {formatPrice(v)}
          </option>
        ));
        // 種別が決まっていればグループ見出しは不要
        return type ? (
          options
        ) : (
          <optgroup key={g} label={g === "rent" ? "賃貸（月額）" : "売買"}>
            {options}
          </optgroup>
        );
      })}
    </>
  );
}

export function PropertySearchForm({ initial = {}, variant = "full" }: Props) {
  const id = useId();
  const [type, setType] = useState(initial.type ?? "");
  const [minPrice, setMinPrice] = useState(initial.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice?.toString() ?? "");
  const layout = initial.layout;
  const layoutExtra = layout && !LAYOUT_OPTIONS.includes(layout) ? layout : undefined;

  const currentType = type === "rent" || type === "sale" ? type : undefined;

  // 種別を切り替えたとき、切替先のプリセットに無い価格（かつプリセット外の任意値でもない）はクリアする
  function handleTypeChange(next: string) {
    setType(next);
    if (next !== "rent" && next !== "sale") return;
    const all = [...PRICE_PRESETS.rent, ...PRICE_PRESETS.sale];
    const keep = (v: string) =>
      v === "" || PRICE_PRESETS[next].includes(Number(v)) || !all.includes(Number(v));
    if (!keep(minPrice)) setMinPrice("");
    if (!keep(maxPrice)) setMaxPrice("");
  }

  const field = "flex min-w-[8rem] flex-1 flex-col gap-1";
  const labelClass = "text-xs font-bold text-gray-600";

  return (
    <form
      action="/properties"
      method="get"
      className={`flex flex-wrap items-end gap-3 text-sm ${
        variant === "full" ? "rounded-lg border border-gray-200 bg-white p-3" : ""
      }`}
    >
      <div className={field}>
        <label htmlFor={`${id}-type`} className={labelClass}>
          種別
        </label>
        <select
          id={`${id}-type`}
          name="type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className={selectClass}
        >
          <option value="">指定なし</option>
          <option value="rent">{PROPERTY_TYPE_LABEL.rent}</option>
          <option value="sale">{PROPERTY_TYPE_LABEL.sale}</option>
        </select>
      </div>
      <div className={field}>
        <label htmlFor={`${id}-min`} className={labelClass}>
          価格（下限）
        </label>
        <select
          id={`${id}-min`}
          name="minPrice"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className={selectClass}
        >
          <PriceOptions type={currentType} current={minPrice ? Number(minPrice) : undefined} />
        </select>
      </div>
      <div className={field}>
        <label htmlFor={`${id}-max`} className={labelClass}>
          価格（上限）
        </label>
        <select
          id={`${id}-max`}
          name="maxPrice"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className={selectClass}
        >
          <PriceOptions type={currentType} current={maxPrice ? Number(maxPrice) : undefined} />
        </select>
      </div>
      <div className={field}>
        <label htmlFor={`${id}-layout`} className={labelClass}>
          間取り
        </label>
        <select
          id={`${id}-layout`}
          name="layout"
          defaultValue={layout ?? ""}
          className={selectClass}
        >
          <option value="">指定なし</option>
          {layoutExtra && <option value={layoutExtra}>{layoutExtra}</option>}
          {LAYOUT_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className={`${field} min-w-[9rem]`}>
        <label htmlFor={`${id}-keyword`} className={labelClass}>
          キーワード
        </label>
        <input
          id={`${id}-keyword`}
          name="keyword"
          type="text"
          placeholder="例: ペット可"
          defaultValue={initial.keyword ?? ""}
          className={selectClass}
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="submit"
          className="cursor-pointer rounded bg-brand-teal px-4 py-1.5 text-white hover:bg-brand-navy"
        >
          この条件で検索
        </button>
        {variant === "full" && (
          <Link href="/properties" className="text-brand-teal underline hover:text-brand-navy">
            条件をクリア
          </Link>
        )}
      </div>
    </form>
  );
}

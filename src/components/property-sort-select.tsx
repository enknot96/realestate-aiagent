"use client";

import { useId } from "react";
import { buildSearchParams, DEFAULT_SORT, SORT_OPTIONS, type PropertySearchConditions } from "@/lib/property";

// 一覧の並び替え。現在の絞り込み条件を hidden で持つ GET フォームなので、JS無効でも <noscript> のボタンで動く。
// offset は送らない＝並び順を変えると1ページ目に戻る
export function PropertySortSelect({ conditions }: { conditions: PropertySearchConditions }) {
  const id = useId();
  const { sort, ...filters } = conditions;
  const hidden = Array.from(buildSearchParams(filters).entries());

  return (
    <form action="/properties" method="get" className="flex items-center gap-2 text-sm">
      {hidden.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor={id} className="text-xs font-bold text-gray-600">
        並び替え
      </label>
      <select
        id={id}
        name="sort"
        defaultValue={sort ?? DEFAULT_SORT}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-gray-300 bg-white p-1.5"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="rounded bg-brand-teal px-3 py-1.5 text-white">
          適用
        </button>
      </noscript>
    </form>
  );
}

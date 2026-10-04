"use client";

import { useState, type ReactNode } from "react";
import { formatPrice, SALE_KIND_LABEL, type SaleKind } from "@/lib/property";
import {
  formatTsubo,
  isBuiltYearMonth,
  isFieldVisible,
  toDraftJson,
  type DraftFieldKey,
  type DraftFormState,
} from "./form-state";

type Props = {
  state: DraftFormState;
  // AIが読み取れず推測した項目（編集すると確認済みとして外れる）
  uncertain: ReadonlySet<DraftFieldKey>;
  onChange: <K extends DraftFieldKey>(key: K, value: DraftFormState[K]) => void;
};

const inputBase = "w-full rounded border p-2 text-sm";

function Field({
  label,
  uncertain,
  hint,
  children,
}: {
  label: string;
  uncertain: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex flex-col gap-1 rounded-lg p-2 ${
        uncertain ? "border border-amber-300 bg-amber-50" : "border border-transparent"
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
        {label}
        {uncertain && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
            要確認
          </span>
        )}
      </span>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

// 編集できる登録の下書きフォーム。推測された項目は琥珀色で強調して「要確認」と表示する
export function DraftForm({ state, uncertain, onChange }: Props) {
  const [chipInput, setChipInput] = useState("");
  const [copied, setCopied] = useState(false);

  const show = (key: DraftFieldKey) => isFieldVisible(state, key);
  // 種別に合わず隠れている項目は、強調も件数も対象外にする
  const u = (key: DraftFieldKey) => show(key) && uncertain.has(key);
  const uncertainCount = [...uncertain].filter(show).length;
  const cls = (key: DraftFieldKey) =>
    `${inputBase} ${u(key) ? "border-amber-400 bg-white" : "border-gray-300"}`;

  const priceNumber = Number(state.price);
  const pricePreview =
    state.price.trim() !== "" && Number.isFinite(priceNumber) && priceNumber >= 0
      ? formatPrice(priceNumber, state.type === "" ? undefined : state.type)
      : null;

  const json = JSON.stringify(toDraftJson(state), null, 2);

  function addChip() {
    const value = chipInput.trim();
    if (value && !state.features.includes(value)) {
      onChange("features", [...state.features, value]);
    }
    setChipInput("");
  }

  return (
    <div className="flex flex-col gap-3">
      {uncertainCount > 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          資料から読み取れず、AIが推測した項目が <b>{uncertainCount}件</b>
          あります。琥珀色の「要確認」の項目を資料と見比べて確認してください。
        </p>
      )}

      <div className="grid gap-1 sm:grid-cols-2">
        <Field label="種別" uncertain={u("type")}>
          <select
            value={state.type}
            onChange={(e) => onChange("type", e.target.value as DraftFormState["type"])}
            className={cls("type")}
          >
            <option value="">未選択</option>
            <option value="rent">賃貸</option>
            <option value="sale">売買</option>
          </select>
        </Field>
        {show("saleKind") && (
          <Field label="物件種別" uncertain={u("saleKind")}>
            <select
              value={state.saleKind}
              onChange={(e) => onChange("saleKind", e.target.value as DraftFormState["saleKind"])}
              className={cls("saleKind")}
            >
              <option value="">未選択</option>
              {(Object.keys(SALE_KIND_LABEL) as SaleKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {SALE_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="物件名" uncertain={u("title")}>
          <input
            value={state.title}
            onChange={(e) => onChange("title", e.target.value)}
            className={cls("title")}
          />
        </Field>
        <Field
          label={state.type === "rent" ? "価格（月額・円）" : "価格（円）"}
          uncertain={u("price")}
          hint={
            pricePreview ? (
              <b className="text-brand-teal">{pricePreview}</b>
            ) : (
              "円の整数で入力（例: 85000）"
            )
          }
        >
          <input
            inputMode="numeric"
            value={state.price}
            onChange={(e) => onChange("price", e.target.value)}
            className={cls("price")}
          />
        </Field>
        {show("layout") && (
          <Field label="間取り" uncertain={u("layout")}>
            <input
              value={state.layout}
              onChange={(e) => onChange("layout", e.target.value)}
              className={cls("layout")}
            />
          </Field>
        )}
        {show("area") && (
          <Field label="専有面積（㎡）" uncertain={u("area")}>
            <input
              inputMode="decimal"
              value={state.area}
              onChange={(e) => onChange("area", e.target.value)}
              className={cls("area")}
            />
          </Field>
        )}
        {show("landArea") && (
          <Field label="土地面積（㎡）" uncertain={u("landArea")} hint={formatTsubo(state.landArea)}>
            <input
              inputMode="decimal"
              value={state.landArea}
              onChange={(e) => onChange("landArea", e.target.value)}
              className={cls("landArea")}
            />
          </Field>
        )}
        {show("privateRoadArea") && (
          <Field label="私道負担（㎡）" uncertain={u("privateRoadArea")} hint="無い場合は 0">
            <input
              inputMode="decimal"
              value={state.privateRoadArea}
              onChange={(e) => onChange("privateRoadArea", e.target.value)}
              className={cls("privateRoadArea")}
            />
          </Field>
        )}
        {show("buildingArea") && (
          <Field label="建物面積（㎡）" uncertain={u("buildingArea")} hint={formatTsubo(state.buildingArea)}>
            <input
              inputMode="decimal"
              value={state.buildingArea}
              onChange={(e) => onChange("buildingArea", e.target.value)}
              className={cls("buildingArea")}
            />
          </Field>
        )}
        <Field label="住所" uncertain={u("address")}>
          <input
            value={state.address}
            onChange={(e) => onChange("address", e.target.value)}
            className={cls("address")}
          />
        </Field>
        <Field label="最寄り駅" uncertain={u("nearestStation")} hint="駅名のみ（例: 逆瀬川）">
          <input
            value={state.nearestStation}
            onChange={(e) => onChange("nearestStation", e.target.value)}
            className={cls("nearestStation")}
          />
        </Field>
        <Field label="徒歩（分）" uncertain={u("walkMinutes")}>
          <input
            inputMode="numeric"
            value={state.walkMinutes}
            onChange={(e) => onChange("walkMinutes", e.target.value)}
            className={cls("walkMinutes")}
          />
        </Field>
        {show("builtYearMonth") && (
          <Field
            label="築年月"
            uncertain={u("builtYearMonth")}
            hint={
              state.builtYearMonth.trim() === "" || isBuiltYearMonth(state.builtYearMonth)
                ? "例: 2002-03"
                : "月まで入力すると（例: 2002-03）登録用のJSONに入ります"
            }
          >
            <input
              value={state.builtYearMonth}
              onChange={(e) => onChange("builtYearMonth", e.target.value)}
              placeholder="YYYY-MM"
              className={cls("builtYearMonth")}
            />
          </Field>
        )}
      </div>

      <div
        className={`flex flex-col gap-2 rounded-lg p-2 ${
          u("features") ? "border border-amber-300 bg-amber-50" : "border border-transparent"
        }`}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
          設備・特徴
          {u("features") && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
              要確認
            </span>
          )}
        </span>
        <ul className="flex flex-wrap gap-2">
          {state.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-1 rounded-full bg-brand-teal/10 py-1 pr-1 pl-3 text-xs font-medium text-brand-navy"
            >
              {feature}
              <button
                type="button"
                aria-label={`${feature}を削除`}
                onClick={() =>
                  onChange(
                    "features",
                    state.features.filter((f) => f !== feature),
                  )
                }
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-brand-teal hover:text-white"
              >
                ×
              </button>
            </li>
          ))}
          {state.features.length === 0 && (
            <li className="text-xs text-gray-500">読み取れた設備・特徴はありません</li>
          )}
        </ul>
        <div className="flex gap-2">
          <input
            value={chipInput}
            onChange={(e) => setChipInput(e.target.value)}
            onKeyDown={(e) => {
              // 日本語入力の変換確定のEnterでは追加しない
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                addChip();
              }
            }}
            placeholder="特徴を追加（例: ペット可）"
            className={`${inputBase} border-gray-300`}
          />
          <button
            type="button"
            onClick={addChip}
            className="shrink-0 cursor-pointer rounded border border-brand-teal px-3 text-sm font-bold text-brand-teal hover:bg-brand-teal hover:text-white"
          >
            追加
          </button>
        </div>
      </div>

      <Field
        label="キャッチコピー"
        uncertain={u("catchCopy")}
        hint={`${state.catchCopy.length}字（30字以内が目安）`}
      >
        <input
          value={state.catchCopy}
          onChange={(e) => onChange("catchCopy", e.target.value)}
          className={cls("catchCopy")}
        />
      </Field>
      <Field
        label="紹介文"
        uncertain={u("description")}
        hint={`${state.description.length}字（200字程度が目安）`}
      >
        <textarea
          rows={6}
          value={state.description}
          onChange={(e) => onChange("description", e.target.value)}
          className={cls("description")}
        />
      </Field>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 text-sm font-bold text-white"
        >
          この内容で登録する
        </button>
        <p className="text-xs text-gray-500">
          デモのため登録はできません。実際の登録は realestate-api と連携後に対応予定です。
        </p>
      </div>

      <details className="rounded-lg border border-gray-200 bg-gray-50">
        <summary className="cursor-pointer p-3 text-sm font-bold text-brand-navy">
          下書きのJSONを見る
        </summary>
        <div className="flex flex-col gap-2 border-t border-gray-200 p-3">
          <pre className="max-h-72 overflow-auto rounded bg-brand-navy p-3 text-xs break-all whitespace-pre-wrap text-white">
            {json}
          </pre>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                // クリップボードが使えない環境では何もしない
              }
            }}
            className="cursor-pointer self-start rounded border border-brand-teal px-3 py-1.5 text-xs font-bold text-brand-teal hover:bg-brand-teal hover:text-white"
          >
            {copied ? "コピーしました" : "JSONをコピー"}
          </button>
        </div>
      </details>
    </div>
  );
}

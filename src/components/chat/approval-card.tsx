"use client";

import { formatFieldValue } from "./format";
import { FIELD_LABELS, TOOL_TITLES } from "./tool-labels";
import type { ApprovalRequestedPart } from "./types";

export function ApprovalCard({
  part,
  onRespond,
}: {
  part: ApprovalRequestedPart;
  onRespond: (approved: boolean) => void;
}) {
  return (
    <div className="my-1 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm">
      <p className="mb-2 font-bold">{TOOL_TITLES[part.type] ?? "操作を実行します"}</p>
      <dl className="mb-3 space-y-1">
        {Object.entries(part.input)
          .filter(([key]) => key in FIELD_LABELS)
          .map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="w-32 shrink-0 text-gray-500">{FIELD_LABELS[key]}</dt>
              <dd className="break-all">{formatFieldValue(key, value)}</dd>
            </div>
          ))}
      </dl>
      <p className="mb-3 text-xs text-gray-500">この内容で実行してよろしいですか？</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-brand-teal px-4 py-1.5 text-white hover:bg-brand-navy"
          onClick={() => onRespond(true)}
        >
          承認する
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-gray-300 px-4 py-1.5"
          onClick={() => onRespond(false)}
        >
          拒否する
        </button>
      </div>
    </div>
  );
}

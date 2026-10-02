"use client";

import { CheckIcon, ClockIcon, ExclamationIcon, PauseIcon, XCircleIcon } from "@/components/icons";
import { AvailabilitySlots } from "./availability-slots";
import { PropertyLinks } from "./property-links";
import { TOOL_TITLES, TOOL_VIEWS } from "./tool-labels";
import type { AvailabilityOutput, PropertyLinkItem, ToolPart } from "./types";

export function ToolStep({
  part,
  onPickSlot,
}: {
  part: ToolPart;
  onPickSlot: (label: string) => void;
}) {
  const view = TOOL_VIEWS[part.type];
  const input = part.input ?? {};
  const output = (part.output ?? {}) as Record<string, unknown>;
  const label = part.type.replace("tool-", "");

  let icon = <ClockIcon className="h-2.5 w-2.5" />;
  let badgeTone = "bg-gray-200 text-gray-500";
  let text = view ? view.running(input) : `${label} を実行中…`;
  let tone = "text-gray-500";

  switch (part.state) {
    case "output-available":
      if (output.error) {
        const err = output.error as { message?: string };
        icon = <ExclamationIcon className="h-2.5 w-2.5" />;
        badgeTone = "bg-red-100 text-red-600";
        text = `${label}: 実行できませんでした — ${err.message ?? "不明なエラー"}`;
        tone = "text-red-600";
      } else {
        icon = <CheckIcon className="h-2.5 w-2.5" />;
        badgeTone = "bg-brand-teal/15 text-brand-teal";
        text = view ? view.done(input, output) : `${label} が完了しました`;
        tone = "text-gray-700";
      }
      break;
    case "output-error":
      icon = <ExclamationIcon className="h-2.5 w-2.5" />;
      badgeTone = "bg-red-100 text-red-600";
      text = `${label} の実行でエラーが発生しました`;
      tone = "text-red-600";
      break;
    case "output-denied":
      icon = <XCircleIcon className="h-2.5 w-2.5" />;
      badgeTone = "bg-gray-200 text-gray-500";
      text = `${TOOL_TITLES[part.type] ?? label} — 実行をキャンセルしました（拒否）`;
      tone = "text-gray-500";
      break;
    case "approval-responded":
      if (part.approval?.approved === false) {
        icon = <XCircleIcon className="h-2.5 w-2.5" />;
        badgeTone = "bg-gray-200 text-gray-500";
        text = `${TOOL_TITLES[part.type] ?? label} — キャンセルを送信しました`;
        tone = "text-gray-500";
      } else {
        icon = <ClockIcon className="h-2.5 w-2.5" />;
        text = "承認を受け付けました。実行中…";
      }
      break;
    case "approval-requested":
      // 通常はApprovalCardが表示される。approval IDが取れない異常時のフォールバック
      icon = <PauseIcon className="h-2.5 w-2.5" />;
      text = `${TOOL_TITLES[part.type] ?? label} — 承認待ちです`;
      break;
  }

  const showSlots =
    part.type === "tool-checkViewingAvailability" &&
    part.state === "output-available" &&
    !output.error;

  const showPropertyLinks =
    part.state === "output-available" &&
    !output.error &&
    (part.type === "tool-searchProperties" || part.type === "tool-getPropertyDetail");
  const propertyLinks: PropertyLinkItem[] = !showPropertyLinks
    ? []
    : part.type === "tool-searchProperties"
      ? ((output.properties as PropertyLinkItem[] | undefined) ?? [])
      : [{ id: Number(output.id), title: String(output.title), price: Number(output.price) }];

  return (
    <div className="my-0.5 text-sm">
      <p className={`flex items-center gap-1.5 ${tone}`}>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${badgeTone}`}
        >
          {icon}
        </span>
        {text}
      </p>
      {showSlots && (
        <AvailabilitySlots output={output as AvailabilityOutput} onPickSlot={onPickSlot} />
      )}
      <PropertyLinks properties={propertyLinks} />
    </div>
  );
}

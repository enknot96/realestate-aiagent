"use client";

import Link from "next/link";
import { useState } from "react";
import { PropertyThumbnail } from "@/components/property";
import { CalendarIcon, CheckIcon } from "@/components/icons";
import { buildGoogleCalendarUrl, buildViewingIcs, VIEWING_DURATION_MS } from "./calendar";
import type { ViewingCalendarInfo } from "./calendar";
import { useConversationIndex } from "./conversation-context";

const jstParts = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Tokyo",
});

// 「2026年10月10日(土) 14:00〜15:00」（内見の枠は1時間）
export function formatViewingRange(scheduledAt: string): string {
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return scheduledAt;
  const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const s = jstParts.formatToParts(start);
  const e = jstParts.formatToParts(new Date(start.getTime() + VIEWING_DURATION_MS));
  return (
    `${get(s, "year")}年${get(s, "month")}月${get(s, "day")}日(${get(s, "weekday")}) ` +
    `${get(s, "hour")}:${get(s, "minute")}〜${get(e, "hour")}:${get(e, "minute")}`
  );
}

export function ViewingCompleteCard({
  input,
  output,
}: {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}) {
  const { findPropertyByInquiryId } = useConversationIndex();
  const [downloadError, setDownloadError] = useState(false);
  const property = findPropertyByInquiryId(Number(input.inquiryId));
  const scheduledAt = String(output.scheduledAt ?? input.scheduledAt);
  const info: ViewingCalendarInfo = {
    viewingId: Number(output.viewingId),
    scheduledAt,
    propertyTitle: property?.title,
    address: property?.address,
  };

  function downloadIcs() {
    try {
      const blob = new Blob([buildViewingIcs(info)], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viewing-${info.viewingId}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadError(false);
    } catch {
      setDownloadError(true);
    }
  }

  const buttonBase =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold";

  return (
    <div className="mt-3 max-w-md overflow-hidden rounded-xl border border-brand-teal/40 bg-white shadow-sm">
      <div className="brand-gradient flex items-center gap-2.5 px-4 py-3 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25">
          <CheckIcon className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold">内見予約が確定しました</p>
      </div>
      <div className="space-y-3 p-4">
        {property && (
          <div className="flex gap-3">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md">
              <PropertyThumbnail property={{ imageUrl: property.imageUrl, title: property.title ?? "物件" }} />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-bold">{property.title}</p>
              <p className="truncate text-xs text-gray-500">{property.address}</p>
            </div>
          </div>
        )}
        <dl className="space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-xs text-gray-500">日時</dt>
            <dd className="font-bold">{formatViewingRange(scheduledAt)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-xs text-gray-500">予約番号</dt>
            <dd>{String(output.viewingId)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadIcs}
            className={`${buttonBase} bg-brand-teal text-white hover:opacity-90`}
          >
            <CalendarIcon className="h-4 w-4" />
            カレンダーに追加（.ics）
          </button>
          <a
            href={buildGoogleCalendarUrl(info)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} border border-brand-teal text-brand-teal hover:bg-brand-teal/5`}
          >
            Googleカレンダーに追加
          </a>
          {property && (
            <Link
              href={`/properties/${property.id}`}
              className={`${buttonBase} border border-gray-300 text-gray-700 hover:bg-gray-50`}
            >
              物件ページを見る
            </Link>
          )}
        </div>
        {downloadError && (
          <p className="text-xs text-red-600">
            ファイルを作成できませんでした。Googleカレンダーのリンクをお試しください
          </p>
        )}
      </div>
    </div>
  );
}

export function InquiryCompleteCard({
  input,
  output,
}: {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}) {
  const { findProperty } = useConversationIndex();
  const property = findProperty(Number(input.propertyId));
  return (
    <div className="mt-3 flex max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-bold">お問い合わせを受け付けました</p>
        {property?.title && <p className="truncate text-xs text-gray-600">{property.title}</p>}
        <p className="text-xs text-gray-500">受付番号: {String(output.inquiryId)}</p>
      </div>
    </div>
  );
}

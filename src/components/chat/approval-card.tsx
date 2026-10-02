"use client";

import { useId, useState } from "react";
import { CalendarIcon, MailIcon } from "@/components/icons";
import { PropertyThumbnail } from "@/components/property";
import { formatPrice } from "@/lib/property";
import { useConversationIndex } from "./conversation-context";
import { jstDate, jstTime } from "./format";
import { APPROVAL_TITLES } from "./tool-labels";
import type { ApprovalRequestedPart, ConversationProperty } from "./types";

// 内見の枠は1時間
const VIEWING_DURATION_MS = 60 * 60 * 1000;

// 「10月10日(土) 14:00〜15:00」。日時として読めない値は null
function formatViewingRange(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + VIEWING_DURATION_MS);
  return `${jstDate.format(start)} ${jstTime.format(start)}〜${jstTime.format(end)}`;
}

function PropertyMini({ property }: { property: ConversationProperty }) {
  return (
    <div className="mb-3 flex gap-3 rounded-lg border border-amber-200 bg-white p-2">
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md">
        <PropertyThumbnail property={{ imageUrl: property.imageUrl, title: property.title ?? "物件" }} />
      </div>
      <div className="min-w-0">
        {property.title && <p className="truncate font-bold">{property.title}</p>}
        {typeof property.price === "number" && (
          <p className="font-bold text-brand-navy">
            {formatPrice(
              property.price,
              property.type === "rent" || property.type === "sale" ? property.type : undefined,
            )}
          </p>
        )}
        {property.address && <p className="truncate text-xs text-gray-500">{property.address}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="break-all whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

export function ApprovalCard({
  part,
  onRespond,
}: {
  part: ApprovalRequestedPart;
  onRespond: (approved: boolean) => void;
}) {
  const titleId = useId();
  const { findProperty, findPropertyByInquiryId } = useConversationIndex();
  // 押した直後に両ボタンを無効化して二重送信を防ぐ
  const [responded, setResponded] = useState<"approved" | "rejected" | null>(null);

  const isViewing = part.type === "tool-createViewing";
  const isInquiry = part.type === "tool-createInquiry";
  const input = part.input;

  const propertyId = typeof input.propertyId === "number" ? input.propertyId : undefined;
  const inquiryId = typeof input.inquiryId === "number" ? input.inquiryId : undefined;
  const property = isInquiry
    ? propertyId !== undefined
      ? findProperty(propertyId)
      : undefined
    : isViewing && inquiryId !== undefined
      ? findPropertyByInquiryId(inquiryId)
      : undefined;
  const range = isViewing ? formatViewingRange(input.scheduledAt) : null;

  const respond = (approved: boolean) => {
    if (responded) return;
    setResponded(approved ? "approved" : "rejected");
    onRespond(approved);
  };

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="relative my-1 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm shadow-sm"
    >
      {/* 承認待ちに気づけるよう枠をゆっくり脈動させる（動きを減らす設定では静止） */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 rounded-lg border-2 border-amber-300 motion-safe:animate-pulse"
      />
      <p id={titleId} className="mb-3 flex items-center gap-1.5 font-bold text-amber-900">
        {isViewing ? <CalendarIcon className="h-5 w-5" /> : <MailIcon className="h-5 w-5" />}
        {APPROVAL_TITLES[part.type] ?? "操作の実行を確認"}
      </p>

      {property ? (
        <PropertyMini property={property} />
      ) : (
        (propertyId !== undefined || inquiryId !== undefined) && (
          <p className="mb-3 text-xs text-gray-500">
            {propertyId !== undefined ? `物件ID ${propertyId}` : `問い合わせID ${inquiryId}`}
          </p>
        )
      )}

      {isViewing && (
        <div className="mb-3 rounded-lg bg-white p-3 text-center">
          <p className="text-xs text-gray-500">内見日時</p>
          <p className="text-lg text-brand-navy font-bold sm:text-xl">
            {range ?? String(input.scheduledAt ?? "")}
          </p>
        </div>
      )}

      {isInquiry && (
        <dl className="mb-3 space-y-2 rounded-lg bg-white p-3">
          <Field label="お名前">{String(input.name ?? "")}</Field>
          <Field label="メールアドレス">{String(input.email ?? "")}</Field>
          {Boolean(input.phone) && <Field label="電話番号">{String(input.phone)}</Field>}
          <Field label="問い合わせ内容">{String(input.message ?? "")}</Field>
        </dl>
      )}

      <p className="mb-3 text-xs text-gray-600">この内容は、あなたが承認するまで送信されません</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={isViewing ? "内見予約を承認する" : "お問い合わせの送信を承認する"}
          disabled={responded !== null}
          className="cursor-pointer rounded-lg bg-brand-teal px-4 py-1.5 font-bold text-white hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => respond(true)}
        >
          承認する
        </button>
        <button
          type="button"
          aria-label="承認せずにやめる"
          disabled={responded !== null}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => respond(false)}
        >
          やめる
        </button>
        {responded && (
          <span role="status" className="text-xs text-gray-600">
            {responded === "approved" ? "送信中…" : "取りやめています…"}
          </span>
        )}
      </div>
    </div>
  );
}

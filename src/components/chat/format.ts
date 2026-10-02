export const jstDateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

export const jstDate = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

export const jstTime = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

// ISO形式の日時は「2026年7月18日土曜日 10:00」のような読みやすい表記にする
export function formatFieldValue(key: string, value: unknown): string {
  if (key === "scheduledAt" && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return jstDateTime.format(date);
    }
  }
  return String(value);
}

// 検索条件を「賃貸・〜80,000円・2LDK・「ペット可」」のような短い日本語にする
export function describeSearchInput(input: Record<string, unknown> = {}): string {
  const parts: string[] = [];
  if (input.type) parts.push(input.type === "rent" ? "賃貸" : "売買");
  if (typeof input.minPrice === "number") parts.push(`${input.minPrice.toLocaleString()}円以上`);
  if (typeof input.maxPrice === "number") parts.push(`〜${input.maxPrice.toLocaleString()}円`);
  if (input.layout) parts.push(String(input.layout));
  if (input.keyword) parts.push(`「${String(input.keyword)}」`);
  return parts.length > 0 ? parts.join("・") : "条件指定なし";
}

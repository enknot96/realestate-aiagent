// 内見予約をカレンダーに登録するための .ics / Googleカレンダー URL を作る純粋関数。
// 内見の枠は1時間（エージェント側の仕様）。

export const VIEWING_DURATION_MS = 60 * 60 * 1000;

export type ViewingCalendarInfo = {
  viewingId: number;
  scheduledAt: string;
  propertyTitle?: string;
  address?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// UTCの「YYYYMMDDTHHMMSSZ」形式（RFC 5545 の DATE-TIME。.ics と Googleカレンダー共通）
export function toUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

// TEXT 値のエスケープ（RFC 5545 3.3.11）。バックスラッシュを最初に処理する
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// 75オクテットを超える行は CRLF + 空白で折り返す（UTF-8の文字境界は壊さない）
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const chunks: string[] = [];
  let current = "";
  let bytes = 0;
  // 2行目以降は先頭の空白1オクテット分だけ使えるバイト数が減る
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      chunks.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join("\r\n ");
}

function summaryOf(info: ViewingCalendarInfo): string {
  return info.propertyTitle ? `内見: ${info.propertyTitle}` : "内見";
}

function descriptionOf(info: ViewingCalendarInfo): string {
  return `予約番号: ${info.viewingId}\nみらい不動産`;
}

// dtstamp / uid は呼び出し側から差し替えられる（テストで固定するため）
export function buildViewingIcs(
  info: ViewingCalendarInfo,
  options: { now?: Date } = {},
): string {
  const start = new Date(info.scheduledAt);
  const end = new Date(start.getTime() + VIEWING_DURATION_MS);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mirai Fudosan//Chat Viewing//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:viewing-${info.viewingId}@mirai-fudosan.example`,
    `DTSTAMP:${toUtcStamp(options.now ?? new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(summaryOf(info))}`,
    ...(info.address ? [`LOCATION:${escapeIcsText(info.address)}`] : []),
    `DESCRIPTION:${escapeIcsText(descriptionOf(info))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function buildGoogleCalendarUrl(info: ViewingCalendarInfo): string {
  const start = new Date(info.scheduledAt);
  const end = new Date(start.getTime() + VIEWING_DURATION_MS);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summaryOf(info),
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    details: descriptionOf(info),
  });
  if (info.address) params.set("location", info.address);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

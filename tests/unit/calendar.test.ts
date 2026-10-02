import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildViewingIcs,
  escapeIcsText,
  toUtcStamp,
} from "@/components/chat/calendar";

const info = {
  viewingId: 12,
  // JST 14:00 = UTC 05:00
  scheduledAt: "2026-10-10T14:00:00+09:00",
  propertyTitle: "駅近2LDK, 日当たり良好",
  address: "東京都渋谷区1-2-3",
};
const now = new Date("2026-10-02T00:00:00Z");

describe("toUtcStamp", () => {
  it("UTCの YYYYMMDDTHHMMSSZ にする", () => {
    expect(toUtcStamp(new Date("2026-10-10T14:00:00+09:00"))).toBe("20261010T050000Z");
  });

  it("JSTの日付境界をまたぐとUTCでは前日になる", () => {
    expect(toUtcStamp(new Date("2026-10-10T00:30:00+09:00"))).toBe("20261009T153000Z");
  });
});

describe("escapeIcsText", () => {
  it("バックスラッシュ・セミコロン・カンマ・改行をエスケープする", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\;c\\,d\\ne");
  });
});

describe("buildViewingIcs", () => {
  const ics = buildViewingIcs(info, { now });
  const lines = ics.split("\r\n");

  it("行区切りは CRLF で、末尾も CRLF", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("VCALENDAR / VEVENT で囲まれている", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines[lines.length - 2]).toBe("END:VCALENDAR");
  });

  it("開始・終了（1時間枠）と DTSTAMP がUTCで出力される", () => {
    expect(lines).toContain("DTSTART:20261010T050000Z");
    expect(lines).toContain("DTEND:20261010T060000Z");
    expect(lines).toContain("DTSTAMP:20261002T000000Z");
  });

  it("UID・SUMMARY・LOCATION・DESCRIPTION を含み、テキストはエスケープされる", () => {
    expect(lines).toContain("UID:viewing-12@mirai-fudosan.example");
    expect(lines).toContain("SUMMARY:内見: 駅近2LDK\\, 日当たり良好");
    expect(lines).toContain("LOCATION:東京都渋谷区1-2-3");
    expect(lines).toContain("DESCRIPTION:予約番号: 12\\nみらい不動産");
  });

  it("物件が不明なら LOCATION を出さず SUMMARY は「内見」", () => {
    const out = buildViewingIcs({ viewingId: 1, scheduledAt: info.scheduledAt }, { now });
    expect(out).not.toContain("LOCATION");
    expect(out).toContain("SUMMARY:内見\r\n");
  });

  it("75オクテットを超える行は折り返される", () => {
    const long = buildViewingIcs({ ...info, propertyTitle: "あ".repeat(60) }, { now });
    for (const line of long.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    // 折り返しを戻すと元の文字列になる
    expect(long.replace(/\r\n /g, "")).toContain(`SUMMARY:内見: ${"あ".repeat(60)}`);
  });
});

describe("buildGoogleCalendarUrl", () => {
  const url = new URL(buildGoogleCalendarUrl(info));

  it("calendar.google.com の TEMPLATE リンクになる", () => {
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("dates はUTCの開始/終了（1時間枠）", () => {
    expect(url.searchParams.get("dates")).toBe("20261010T050000Z/20261010T060000Z");
  });

  it("タイトル・場所・詳細が入り、記号は URL エンコードされて往復できる", () => {
    expect(url.searchParams.get("text")).toBe("内見: 駅近2LDK, 日当たり良好");
    expect(url.searchParams.get("location")).toBe("東京都渋谷区1-2-3");
    expect(url.searchParams.get("details")).toBe("予約番号: 12\nみらい不動産");
  });
});

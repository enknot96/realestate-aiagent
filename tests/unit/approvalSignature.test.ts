import { beforeEach, describe, expect, it, vi } from "vitest";
import { signApprovalPayload, verifyApprovalPayload } from "@/lib/approvalSignature";

const PAYLOAD = {
  action: "createViewing",
  inquiryId: 1,
  scheduledAt: "2026-07-18T10:00:00+09:00",
};

describe("approvalSignature", () => {
  beforeEach(() => {
    vi.stubEnv("APPROVAL_SIGNATURE_SECRET", "test-secret-0123456789abcdef");
  });

  it("署名したペイロードと同一の内容なら検証に成功する", () => {
    const token = signApprovalPayload(PAYLOAD);
    expect(verifyApprovalPayload(PAYLOAD, token)).toEqual({ ok: true });
  });

  it("キーの順序が違っても内容が同じなら検証に成功する（正規化）", () => {
    const token = signApprovalPayload(PAYLOAD);
    const reordered = {
      scheduledAt: PAYLOAD.scheduledAt,
      action: PAYLOAD.action,
      inquiryId: PAYLOAD.inquiryId,
    };
    expect(verifyApprovalPayload(reordered, token)).toEqual({ ok: true });
  });

  it("引数が1つでも変わると検証に失敗する", () => {
    const token = signApprovalPayload(PAYLOAD);
    const tampered = { ...PAYLOAD, scheduledAt: "2026-07-18T11:00:00+09:00" };
    const result = verifyApprovalPayload(tampered, token);
    expect(result.ok).toBe(false);
  });

  it("action（ツール種別）が違うとトークンを流用できない", () => {
    const token = signApprovalPayload(PAYLOAD);
    const crossTool = { ...PAYLOAD, action: "createInquiry" };
    expect(verifyApprovalPayload(crossTool, token).ok).toBe(false);
  });

  it("有効期限（10分）を過ぎたトークンは拒否される", () => {
    const now = Date.now();
    const token = signApprovalPayload(PAYLOAD, now);
    const elevenMinutesLater = now + 11 * 60 * 1000;
    const result = verifyApprovalPayload(PAYLOAD, token, elevenMinutesLater);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("有効期限");
    }
  });

  it("形式が壊れたトークンは拒否される（例外を投げない）", () => {
    expect(verifyApprovalPayload(PAYLOAD, "garbage").ok).toBe(false);
    expect(verifyApprovalPayload(PAYLOAD, "12345.").ok).toBe(false);
    expect(verifyApprovalPayload(PAYLOAD, "").ok).toBe(false);
  });

  it("undefinedのフィールド（任意項目の未指定）は署名対象から除外される", () => {
    const withUndefined = { ...PAYLOAD, phone: undefined };
    const token = signApprovalPayload(withUndefined);
    expect(verifyApprovalPayload(PAYLOAD, token)).toEqual({ ok: true });
  });
});

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// 「ユーザーに提示した引数」と「実際に④へ送られる引数」の一致を保証する仕組み。
// 書き込みツールの実行には、事前にサーバーが同一ペイロードへ発行したHMAC署名が必須になる。
// 署名後にモデル（またはクライアント）が引数を1つでも変えると検証に失敗し、実行は拒否される。
// ステートレスなのでサーバーレス環境でも動く。

const EXPIRY_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.APPROVAL_SIGNATURE_SECRET;
  if (!secret) {
    throw new Error("APPROVAL_SIGNATURE_SECRET is not set");
  }
  return secret;
}

// キー順を固定してシリアライズする（同じ内容なら常に同じ文字列になるように）
function canonicalize(payload: Record<string, unknown>): string {
  const sortedKeys = Object.keys(payload)
    .filter((key) => payload[key] !== undefined)
    .sort();
  return JSON.stringify(payload, sortedKeys);
}

function computeMac(canonical: string, expiresAt: number): string {
  return createHmac("sha256", getSecret()).update(`${canonical}|${expiresAt}`).digest("hex");
}

export function signApprovalPayload(
  payload: Record<string, unknown>,
  now: number = Date.now(),
): string {
  const expiresAt = now + EXPIRY_MS;
  const mac = computeMac(canonicalize(payload), expiresAt);
  return `${expiresAt}.${mac}`;
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifyApprovalPayload(
  payload: Record<string, unknown>,
  token: string,
  now: number = Date.now(),
): VerifyResult {
  const [expiresAtRaw, mac] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || !mac) {
    return { ok: false, reason: "確認トークンの形式が不正です" };
  }
  if (now > expiresAt) {
    return { ok: false, reason: "確認トークンの有効期限が切れています。もう一度確認からやり直してください" };
  }

  const expected = computeMac(canonicalize(payload), expiresAt);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(mac, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return {
      ok: false,
      reason: "引数が確認時の内容と一致しません。内容を変える場合は、もう一度確認からやり直してください",
    };
  }

  return { ok: true };
}

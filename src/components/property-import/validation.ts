// 物件資料の画像の検証。クライアント（選択時）とサーバー（route.ts）の両方で同じ基準を使う
// Vercelの関数の受信上限（4.5MB）を超えないよう、画像は4MBまで
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

function isAcceptedType(type: string): type is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

// 形式とサイズの検証。問題がなければ null、あればユーザー向けのエラー文言を返す
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!isAcceptedType(file.type)) {
    return "対応していない形式です。JPEG / PNG / WebP の画像を選んでください。";
  }
  if (file.size === 0) {
    return "ファイルが空です。別の画像を選んでください。";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "ファイルサイズが大きすぎます。4MB以下の画像を選んでください。";
  }
  return null;
}

// Content-Type は申告値のため、サーバーでは先頭バイト（マジックナンバー）が申告と一致するかも確かめる
export function matchesImageSignature(bytes: Uint8Array, type: AcceptedImageType): boolean {
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b);
    case "image/webp":
      // "RIFF"（0-3）+ サイズ（4-7）+ "WEBP"（8-11）
      return (
        [0x52, 0x49, 0x46, 0x46].every((b, i) => bytes[i] === b) &&
        [0x57, 0x45, 0x42, 0x50].every((b, i) => bytes[8 + i] === b)
      );
  }
}

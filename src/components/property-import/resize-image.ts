// スマホで撮った資料の写真は4MB（サーバーの受信上限に合わせた制限）を超えやすいため、
// 送信前にブラウザで縮小する。長辺2000pxあれば資料の文字は十分読める
export const MAX_EDGE_PX = 2000;
// 縮小前に受け付ける元画像の上限（ブラウザのメモリを使いすぎないように）
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const JPEG_QUALITY = 0.88;

// 長辺が maxEdge 以下に収まる寸法（縦横比を保つ。収まっていればそのまま）
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE_PX) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// 縮小が不要（寸法も容量も十分小さい）なら元のファイルを返す。
// 縮小した場合は JPEG に変換する（PNG の透過部分は白で塗る）
export async function downscaleImage(file: File, maxBytes: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const target = fitWithin(bitmap.width, bitmap.height);
    if (target.width === bitmap.width && file.size <= maxBytes) return file;

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, target.width, target.height);
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

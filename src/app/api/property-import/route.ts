import { extractPropertyDraft } from "@/ai/property-import";
import {
  matchesImageSignature,
  validateImageFile,
  type AcceptedImageType,
} from "@/components/property-import/validation";

// フォールバックは最大3段。画像の読み取りは応答に時間がかかるため余裕を持たせる
export const maxDuration = 60;

function badRequest(error: string) {
  return Response.json({ error }, { status: 400 });
}

// 画像は読み取りのためモデルに渡すだけで、保存もログ出力もしない（エラー時も内容・詳細は出さない）
export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("リクエストの形式が正しくありません。");
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return badRequest("画像ファイルが指定されていません。");
  }

  const invalid = validateImageFile(file);
  if (invalid) return badRequest(invalid);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type as AcceptedImageType)) {
    return badRequest("画像ファイルとして読み取れませんでした。別の画像を選んでください。");
  }

  try {
    const draft = await extractPropertyDraft({ image: bytes, mediaType: file.type });
    return Response.json({ draft });
  } catch {
    // 内部の詳細（モデル名・エラー内容）は返さない
    return Response.json(
      { error: "読み取りに失敗しました。少し時間をおいて、もう一度お試しください。" },
      { status: 502 },
    );
  }
}

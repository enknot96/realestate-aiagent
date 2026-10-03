import type { UIMessage } from "ai";
import { type ConversationIndex, type ConversationProperty, isToolPart } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ツール出力の物件オブジェクトから、型の合うフィールドだけを取り出す
function pickProperty(value: unknown): ConversationProperty | undefined {
  if (!isRecord(value) || typeof value.id !== "number") return undefined;
  const picked: ConversationProperty = { id: value.id };
  if (typeof value.type === "string") picked.type = value.type;
  if (typeof value.title === "string") picked.title = value.title;
  if (typeof value.price === "number") picked.price = value.price;
  if (typeof value.layout === "string" || value.layout === null) picked.layout = value.layout;
  if (typeof value.area === "string" || value.area === null) picked.area = value.area;
  if (typeof value.address === "string") picked.address = value.address;
  if (typeof value.imageUrl === "string" || value.imageUrl === null) {
    picked.imageUrl = value.imageUrl;
  }
  for (const key of ["saleKind", "landArea", "buildingArea"] as const) {
    const v = value[key];
    if (typeof v === "string" || v === null) picked[key] = v;
  }
  return picked;
}

// 会話全体のツール結果から物件を引き当てるための索引を作る。
// 書き込み系ツールの入力はIDだけなので、承認カードや完了カードで物件名・画像を出すのに使う
export function buildConversationIndex(messages: UIMessage[]): ConversationIndex {
  const properties = new Map<number, ConversationProperty>();
  const propertyIdByInquiryId = new Map<number, number>();

  const upsert = (property: ConversationProperty | undefined) => {
    if (!property) return;
    // 同じIDは後に出たもので上書きする（詳細の結果が検索結果の情報を補う）
    properties.set(property.id, { ...properties.get(property.id), ...property });
  };

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolPart(part) || part.state !== "output-available") continue;
      const output = part.output;
      // { error: ... } はツール失敗の出力なので無視する
      if (!isRecord(output) || "error" in output) continue;

      switch (part.type) {
        case "tool-searchProperties":
          if (Array.isArray(output.properties)) {
            for (const item of output.properties) upsert(pickProperty(item));
          }
          break;
        case "tool-getPropertyDetail":
          upsert(pickProperty(output));
          break;
        case "tool-createInquiry":
          if (typeof part.input?.propertyId === "number" && typeof output.inquiryId === "number") {
            propertyIdByInquiryId.set(output.inquiryId, part.input.propertyId);
          }
          break;
      }
    }
  }

  return {
    findProperty: (propertyId) => properties.get(propertyId),
    findPropertyByInquiryId: (inquiryId) => {
      const propertyId = propertyIdByInquiryId.get(inquiryId);
      return propertyId === undefined ? undefined : properties.get(propertyId);
    },
  };
}

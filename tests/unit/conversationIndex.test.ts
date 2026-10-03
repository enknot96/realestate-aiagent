import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { buildConversationIndex } from "@/components/chat/conversation-index";
import { parseStoredChat } from "@/components/chat/chat-storage";

// テスト用にツールpartを持つメッセージを組み立てる
function toolMessage(parts: Record<string, unknown>[]): UIMessage {
  return { id: "m1", role: "assistant", parts } as unknown as UIMessage;
}

const searchPart = (properties: unknown[]) => ({
  type: "tool-searchProperties",
  state: "output-available",
  input: {},
  output: { total: properties.length, properties },
});

const property = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  type: "rent",
  title: `物件${id}`,
  price: 8,
  layout: "2LDK",
  area: "50㎡",
  address: "東京都渋谷区",
  imageUrl: null,
  ...extra,
});

describe("buildConversationIndex", () => {
  it("検索結果から物件を引き当てられる", () => {
    const index = buildConversationIndex([
      toolMessage([searchPart([property(1), property(2)])]),
    ]);
    expect(index.findProperty(1)?.title).toBe("物件1");
    expect(index.findProperty(2)?.layout).toBe("2LDK");
    expect(index.findProperty(3)).toBeUndefined();
  });

  it("種別・土地面積・建物面積を取り出す（型が合わないものは無視）", () => {
    const index = buildConversationIndex([
      toolMessage([
        searchPart([
          property(1, { saleKind: "used_house", landArea: "120.30", buildingArea: "98.50" }),
          property(2, { saleKind: null, landArea: 120, buildingArea: undefined }),
        ]),
      ]),
    ]);
    expect(index.findProperty(1)).toMatchObject({
      saleKind: "used_house",
      landArea: "120.30",
      buildingArea: "98.50",
    });
    const p2 = index.findProperty(2);
    expect(p2?.saleKind).toBeNull();
    expect(p2).not.toHaveProperty("landArea");
    expect(p2).not.toHaveProperty("buildingArea");
  });

  it("同じIDは後に出た詳細の結果で上書きされる", () => {
    const index = buildConversationIndex([
      toolMessage([searchPart([property(1, { imageUrl: null })])]),
      toolMessage([
        {
          type: "tool-getPropertyDetail",
          state: "output-available",
          input: { id: 1 },
          output: property(1, { title: "詳細タイトル", imageUrl: "/a.jpg" }),
        },
      ]),
    ]);
    expect(index.findProperty(1)).toMatchObject({
      title: "詳細タイトル",
      imageUrl: "/a.jpg",
    });
  });

  it("inquiryId経由で物件を引き当てられる", () => {
    const index = buildConversationIndex([
      toolMessage([
        searchPart([property(7)]),
        {
          type: "tool-createInquiry",
          state: "output-available",
          input: { propertyId: 7 },
          output: { inquiryId: 99, status: "new" },
        },
      ]),
    ]);
    expect(index.findPropertyByInquiryId(99)?.id).toBe(7);
    expect(index.findPropertyByInquiryId(100)).toBeUndefined();
  });

  it("エラー出力とoutput-availableでないpartは無視する", () => {
    const index = buildConversationIndex([
      toolMessage([
        {
          type: "tool-getPropertyDetail",
          state: "output-available",
          input: { id: 5 },
          output: { error: { code: "NOT_FOUND" } },
        },
        { ...searchPart([property(6)]), state: "input-available" },
        {
          type: "tool-createInquiry",
          state: "output-available",
          input: { propertyId: 6 },
          output: { error: { code: "X", message: "失敗" } },
        },
      ]),
    ]);
    expect(index.findProperty(5)).toBeUndefined();
    expect(index.findProperty(6)).toBeUndefined();
    expect(index.findPropertyByInquiryId(1)).toBeUndefined();
  });
});

describe("parseStoredChat", () => {
  it("正しい形式は復元し、壊れたデータは黙って捨てる", () => {
    const ok = JSON.stringify({
      messages: [
        {
          id: "a",
          role: "user",
          parts: [{ type: "text", text: "こんにちは" }],
        },
      ],
      timestamps: { a: 1, b: "x" },
    });
    expect(parseStoredChat(ok)?.timestamps).toEqual({ a: 1 });
    expect(parseStoredChat("{broken")).toBeUndefined();
    expect(
      parseStoredChat(JSON.stringify({ messages: [{ id: 1 }] })),
    ).toBeUndefined();
    expect(parseStoredChat(null)).toBeUndefined();
  });
});

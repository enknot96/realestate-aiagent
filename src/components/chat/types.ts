export type ApprovalRequestedPart = {
  type: string;
  state: "approval-requested";
  input: Record<string, unknown>;
  approval: { id: string };
};

export type ToolPart = {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  approval?: { id: string; approved?: boolean };
};

export function isToolPart(part: { type: string }): part is ToolPart {
  return part.type.startsWith("tool-");
}

export function isApprovalRequested(part: ToolPart): part is ApprovalRequestedPart {
  return part.state === "approval-requested" && part.approval !== undefined;
}

export type AvailabilityOutput = {
  days?: { date: string; availableStartAts: string[] }[];
};

// 物件一覧/詳細ツールの出力から、詳細ページへのリンクチップを表示する
// （サイトの物件ページとチャットをつなぐ導線。新しいタブで開き会話を保持する）
export type PropertyLinkItem = { id: number; title: string; price: number };

// 会話中のツール出力から集めた物件情報（得られたフィールドのみ持つ）
export type ConversationProperty = {
  id: number;
  type?: string;
  title?: string;
  price?: number;
  layout?: string | null;
  area?: string | null;
  address?: string;
  imageUrl?: string | null;
};

export type ConversationIndex = {
  findProperty: (propertyId: number) => ConversationProperty | undefined;
  findPropertyByInquiryId: (inquiryId: number) => ConversationProperty | undefined;
};

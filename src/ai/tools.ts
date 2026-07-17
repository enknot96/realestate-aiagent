import { tool } from "ai";
import { z } from "zod";
import { realestateApiFetch, RealestateApiError } from "@/lib/realestateApi";
import { getAgentAccessToken, invalidateAgentToken } from "@/lib/agentAuth";
import { signApprovalPayload, verifyApprovalPayload } from "@/lib/approvalSignature";

type PropertyListResponse = {
  properties: {
    id: number;
    type: "rent" | "sale";
    title: string;
    description: string | null;
    price: number;
    layout: string | null;
    area: string | null;
    address: string;
  }[];
  total: number;
  limit: number;
  offset: number;
};

// ツールのエラーは例外で握りつぶさず、構造化してAIに返す（AIが正直に報告・リカバリできるように）
function toToolError(error: unknown) {
  if (error instanceof RealestateApiError) {
    return { error: { status: error.status, code: error.code, message: error.message } };
  }
  return { error: { code: "FETCH_FAILED", message: "物件APIへの接続に失敗しました" } };
}

export const searchProperties = tool({
  description:
    "条件を指定して公開中の物件を検索する。結果は総件数(total)と物件の配列(properties)。" +
    "0件だった場合は、条件を緩めて再検索することを検討する。",
  inputSchema: z.object({
    type: z
      .enum(["rent", "sale"])
      .optional()
      .describe("物件種別。rent=賃貸、sale=売買。ユーザーの意図から判断する"),
    minPrice: z.number().int().nonnegative().optional().describe("下限価格（円）。賃貸は月額家賃"),
    maxPrice: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("上限価格（円）。賃貸は月額家賃。例: 予算8万円以内 → 80000"),
    layout: z
      .string()
      .optional()
      .describe('間取り。完全一致で検索される（例: "2LDK", "1K"）。表記ゆれに注意'),
    keyword: z
      .string()
      .optional()
      .describe('タイトル・説明文の部分一致キーワード（例: "ペット可", "駅近"）。1語のみ'),
    limit: z.number().int().min(1).max(20).default(5).describe("取得件数の上限"),
  }),
  execute: async (input) => {
    const params = new URLSearchParams();
    if (input.type) params.set("type", input.type);
    if (input.minPrice !== undefined) params.set("minPrice", String(input.minPrice));
    if (input.maxPrice !== undefined) params.set("maxPrice", String(input.maxPrice));
    if (input.layout) params.set("layout", input.layout);
    if (input.keyword) params.set("keyword", input.keyword);
    params.set("limit", String(input.limit));

    try {
      const result = await realestateApiFetch<PropertyListResponse>(
        `/properties?${params.toString()}`,
      );
      return {
        total: result.total,
        properties: result.properties.map((p) => ({
          id: p.id,
          type: p.type,
          title: p.title,
          price: p.price,
          layout: p.layout,
          area: p.area,
          address: p.address,
          // 説明文はモデルのコンテキスト節約のため冒頭のみ渡す
          description: p.description ? p.description.slice(0, 100) : null,
        })),
      };
    } catch (error) {
      return toToolError(error);
    }
  },
});

type PropertyDetail = {
  id: number;
  type: "rent" | "sale";
  title: string;
  description: string | null;
  price: number;
  layout: string | null;
  area: string | null;
  address: string;
  status: string;
};

export const getPropertyDetail = tool({
  description: "物件IDを指定して、物件の詳細情報（説明文の全文を含む）を取得する。",
  inputSchema: z.object({
    id: z.number().int().positive().describe("物件ID。searchPropertiesの結果に含まれる"),
  }),
  execute: async (input) => {
    try {
      const p = await realestateApiFetch<PropertyDetail>(`/properties/${input.id}`);
      return {
        id: p.id,
        type: p.type,
        title: p.title,
        description: p.description,
        price: p.price,
        layout: p.layout,
        area: p.area,
        address: p.address,
      };
    } catch (error) {
      return toToolError(error);
    }
  },
});

type AvailabilityResponse = {
  propertyId: number;
  days: {
    date: string;
    slots: { startAt: string; available: boolean }[];
  }[];
};

export const checkViewingAvailability = tool({
  description:
    "物件の内見可能な空き枠を確認する。営業時間はJST 10:00〜18:00の1時間枠。" +
    "期間は最大7日間まで指定できる。結果は日付ごとの空き枠開始時刻(ISO形式)のリスト。",
  inputSchema: z.object({
    propertyId: z.number().int().positive().describe("物件ID"),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("期間の開始日（YYYY-MM-DD）。今日以降の日付を指定する"),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("期間の終了日（YYYY-MM-DD）。fromから7日未満の範囲"),
  }),
  execute: async (input) => {
    const params = new URLSearchParams({ from: input.from, to: input.to });
    try {
      const result = await realestateApiFetch<AvailabilityResponse>(
        `/properties/${input.propertyId}/availability?${params.toString()}`,
      );
      return {
        propertyId: result.propertyId,
        // モデルのコンテキスト節約のため、空いている枠の開始時刻だけを渡す
        days: result.days.map((day) => ({
          date: day.date,
          availableStartAts: day.slots.filter((s) => s.available).map((s) => s.startAt),
        })),
      };
    } catch (error) {
      return toToolError(error);
    }
  },
});

// ── 書き込み系（human-in-the-loop） ──
// 2段階の設計: prepare系ツールが引数一式へのHMAC署名（確認トークン）を発行し、
// create系ツールは「同一の引数＋有効なトークン」でなければ実行を拒否する。
// これにより「ユーザーに提示・承認された内容」と「④へ送られる内容」の一致をサーバー側で保証する。

const inquiryPayloadSchema = z.object({
  propertyId: z.number().int().positive().describe("問い合わせ対象の物件ID"),
  name: z.string().min(1).describe("ユーザー本人に確認した氏名"),
  email: z.email().describe("ユーザー本人に確認したメールアドレス"),
  phone: z.string().min(1).optional().describe("電話番号（任意）"),
  message: z.string().min(1).describe("問い合わせ内容"),
});

const viewingPayloadSchema = z.object({
  inquiryId: z.number().int().positive().describe("createInquiryが返した問い合わせID"),
  scheduledAt: z
    .string()
    .describe(
      "内見日時。checkViewingAvailabilityが返した空き枠のstartAt（ISO 8601形式）をそのまま使う",
    ),
});

export const prepareInquiryConfirmation = tool({
  description:
    "問い合わせ送信の確認トークンを発行する。createInquiryの直前に必ず呼ぶ。" +
    "発行後に引数を変える場合は、このツールからやり直すこと。",
  inputSchema: inquiryPayloadSchema,
  execute: async (input) => ({
    confirmationToken: signApprovalPayload({ action: "createInquiry", ...input }),
    summary: `物件ID ${input.propertyId} に「${input.name}」名義で問い合わせを送信します`,
  }),
});

export const createInquiry = tool({
  description:
    "物件への問い合わせを作成する（書き込み・要ユーザー承認）。" +
    "prepareInquiryConfirmationで取得した確認トークンと、まったく同じ引数で呼ぶこと。",
  inputSchema: inquiryPayloadSchema.extend({
    confirmationToken: z.string().describe("prepareInquiryConfirmationが返したトークン"),
  }),
  execute: async ({ confirmationToken, ...input }) => {
    const verdict = verifyApprovalPayload({ action: "createInquiry", ...input }, confirmationToken);
    if (!verdict.ok) {
      return { error: { code: "CONFIRMATION_MISMATCH", message: verdict.reason } };
    }

    try {
      const inquiry = await realestateApiFetch<{ id: number; status: string }>(
        `/properties/${input.propertyId}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            phone: input.phone,
            message: input.message,
          }),
        },
      );
      return { inquiryId: inquiry.id, status: inquiry.status };
    } catch (error) {
      return toToolError(error);
    }
  },
});

export const prepareViewingConfirmation = tool({
  description:
    "内見予約の確認トークンを発行する。createViewingの直前に必ず呼ぶ。" +
    "発行後に引数を変える場合は、このツールからやり直すこと。",
  inputSchema: viewingPayloadSchema,
  execute: async (input) => ({
    confirmationToken: signApprovalPayload({ action: "createViewing", ...input }),
    summary: `問い合わせID ${input.inquiryId} に ${input.scheduledAt} の内見予約を作成します`,
  }),
});

export const createViewing = tool({
  description:
    "内見予約を作成する（書き込み・要ユーザー承認）。" +
    "prepareViewingConfirmationで取得した確認トークンと、まったく同じ引数で呼ぶこと。",
  inputSchema: viewingPayloadSchema.extend({
    confirmationToken: z.string().describe("prepareViewingConfirmationが返したトークン"),
  }),
  execute: async ({ confirmationToken, ...input }) => {
    const verdict = verifyApprovalPayload({ action: "createViewing", ...input }, confirmationToken);
    if (!verdict.ok) {
      return { error: { code: "CONFIRMATION_MISMATCH", message: verdict.reason } };
    }

    // JWTはこのサーバープロセス内でのみ取得・保持する（クライアントには一切渡さない）
    const post = async () => {
      const token = await getAgentAccessToken();
      return realestateApiFetch<{ id: number; scheduledAt: string; status: string }>(
        `/inquiries/${input.inquiryId}/viewings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ scheduledAt: input.scheduledAt }),
        },
      );
    };

    try {
      let viewing;
      try {
        viewing = await post();
      } catch (error) {
        // キャッシュ済みトークンの失効を1回だけリカバリする
        if (error instanceof RealestateApiError && error.status === 401) {
          invalidateAgentToken();
          viewing = await post();
        } else {
          throw error;
        }
      }
      return { viewingId: viewing.id, scheduledAt: viewing.scheduledAt, status: viewing.status };
    } catch (error) {
      return toToolError(error);
    }
  },
});

export const agentTools = {
  searchProperties,
  getPropertyDetail,
  checkViewingAvailability,
  prepareInquiryConfirmation,
  createInquiry,
  prepareViewingConfirmation,
  createViewing,
};

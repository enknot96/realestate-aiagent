import "server-only";
import { realestateApiFetch } from "@/lib/realestateApi";

// ④のアクセストークン有効期限は15分。期限の1分前には再取得する
const TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_MARGIN_MS = 60 * 1000;

// モジュールスコープのキャッシュ。サーバーレスではインスタンス単位になるが、
// 切れていれば再ログインするだけなのでデモ用途では十分
let cached: { token: string; expiresAt: number } | null = null;

export async function getAgentAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - REFRESH_MARGIN_MS) {
    return cached.token;
  }

  const email = process.env.DEMO_AGENT_EMAIL;
  const password = process.env.DEMO_AGENT_PASSWORD;
  if (!email || !password) {
    throw new Error("DEMO_AGENT_EMAIL / DEMO_AGENT_PASSWORD is not set");
  }

  const { accessToken } = await realestateApiFetch<{ accessToken: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  cached = { token: accessToken, expiresAt: Date.now() + TOKEN_TTL_MS };
  return accessToken;
}

// ④が401を返した場合などに、次回必ず再ログインさせる
export function invalidateAgentToken(): void {
  cached = null;
}

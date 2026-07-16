// ④不動産業務管理APIのエラー形式（{"error":{"code","message",...}}）を保持する例外
export class RealestateApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RealestateApiError";
  }
}

export async function realestateApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.REALESTATE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("REALESTATE_API_BASE_URL is not set");
  }

  const res = await fetch(`${baseUrl}${path}`, init);

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const code = body?.error?.code ?? "UNKNOWN";
    const message = body?.error?.message ?? `④APIがステータス${res.status}を返しました`;
    throw new RealestateApiError(res.status, code, message);
  }

  return body as T;
}

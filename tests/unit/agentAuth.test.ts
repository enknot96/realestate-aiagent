import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// realestateApiFetchをモックして、④への実リクエストなしでキャッシュ挙動を検証する
vi.mock("@/lib/realestateApi", () => ({
  realestateApiFetch: vi.fn(),
}));

import { realestateApiFetch } from "@/lib/realestateApi";
import { getAgentAccessToken, invalidateAgentToken } from "@/lib/agentAuth";

const mockedFetch = vi.mocked(realestateApiFetch);

describe("agentAuth", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_AGENT_EMAIL", "demo-agent@example.com");
    vi.stubEnv("DEMO_AGENT_PASSWORD", "dummy-password");
    vi.useFakeTimers();
    invalidateAgentToken();
    mockedFetch.mockReset();
    mockedFetch.mockResolvedValue({ accessToken: "token-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初回はログインしてトークンを返す", async () => {
    const token = await getAgentAccessToken();
    expect(token).toBe("token-1");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("有効期限内はキャッシュを返し、再ログインしない", async () => {
    await getAgentAccessToken();
    vi.advanceTimersByTime(5 * 60 * 1000); // 5分後（15分-マージン1分の範囲内）
    const token = await getAgentAccessToken();
    expect(token).toBe("token-1");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("期限の1分前を過ぎたら再ログインする", async () => {
    await getAgentAccessToken();
    mockedFetch.mockResolvedValue({ accessToken: "token-2" });
    vi.advanceTimersByTime(14 * 60 * 1000 + 1000); // 14分1秒後（マージンに突入）
    const token = await getAgentAccessToken();
    expect(token).toBe("token-2");
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("invalidateAgentToken後は必ず再ログインする", async () => {
    await getAgentAccessToken();
    invalidateAgentToken();
    mockedFetch.mockResolvedValue({ accessToken: "token-3" });
    const token = await getAgentAccessToken();
    expect(token).toBe("token-3");
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it("認証情報が未設定ならログインを試みず例外を投げる", async () => {
    vi.stubEnv("DEMO_AGENT_PASSWORD", "");
    await expect(getAgentAccessToken()).rejects.toThrow("DEMO_AGENT_EMAIL / DEMO_AGENT_PASSWORD");
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});

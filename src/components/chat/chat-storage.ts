import type { UIMessage } from "ai";

// 会話の保存先はsessionStorage（タブを閉じれば消える。個人情報を長く残さないため）。
// 形式を変えたときはバージョンを上げて、古いデータを読まずに捨てる
export const CHAT_STORAGE_KEY = "mirai-chat:v1";

export type StoredChat = {
  messages: UIMessage[];
  timestamps: Record<string, number>;
};

function isMessage(value: unknown): value is UIMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant" || m.role === "system") &&
    Array.isArray(m.parts)
  );
}

// JSONのparse失敗や形式不一致は黙って破棄する（undefinedを返す）
export function parseStoredChat(raw: string | null): StoredChat | undefined {
  if (!raw) return undefined;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return undefined;
    const { messages, timestamps } = data as Record<string, unknown>;
    if (!Array.isArray(messages) || !messages.every(isMessage)) return undefined;
    const safeTimestamps: Record<string, number> = {};
    if (typeof timestamps === "object" && timestamps !== null) {
      for (const [id, value] of Object.entries(timestamps)) {
        if (typeof value === "number") safeTimestamps[id] = value;
      }
    }
    return { messages, timestamps: safeTimestamps };
  } catch {
    return undefined;
  }
}

// プライベートブラウズ等では例外になるため、読み書きはすべてtry/catchで囲む
export function loadChat(): StoredChat | undefined {
  try {
    return parseStoredChat(sessionStorage.getItem(CHAT_STORAGE_KEY));
  } catch {
    return undefined;
  }
}

export function saveChat(chat: StoredChat): void {
  try {
    if (chat.messages.length === 0) {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chat));
    }
  } catch {
    // 保存できなくても会話自体は続けられる
  }
}

export function clearChat(): void {
  try {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // 同上
  }
}

import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { deriveProgress } from "@/components/chat/progress";

const msg = (...tools: [string, unknown?][]): UIMessage =>
  ({
    id: "m",
    role: "assistant",
    parts: tools.map(([name, output = { ok: true }]) => ({
      type: `tool-${name}`,
      state: "output-available",
      input: {},
      output,
    })),
  }) as unknown as UIMessage;

const statuses = (messages: UIMessage[]) => deriveProgress(messages).map((s) => s.status);

describe("deriveProgress", () => {
  it("会話が空なら最初のステップが現在", () => {
    expect(statuses([])).toEqual(["current", "todo", "todo", "todo", "todo"]);
  });

  it("検索だけ成功したら2番目が現在", () => {
    expect(statuses([msg(["searchProperties"])])).toEqual(["done", "current", "todo", "todo", "todo"]);
  });

  it("空き枠まで確認したら問い合わせが現在", () => {
    expect(statuses([msg(["searchProperties"], ["checkViewingAvailability"])])).toEqual([
      "done", "done", "done", "current", "todo",
    ]);
  });

  it("問い合わせ済みなら内見予約の確定が現在", () => {
    expect(statuses([msg(["searchProperties"], ["checkViewingAvailability"], ["createInquiry"])])).toEqual([
      "done", "done", "done", "done", "current",
    ]);
  });

  it("予約確定ですべて完了", () => {
    expect(statuses([msg(["createInquiry"], ["createViewing"])])).toEqual([
      "done", "done", "done", "done", "done",
    ]);
  });

  it("エラー出力や未完了のツールは数えない", () => {
    const pending = {
      id: "p",
      role: "assistant",
      parts: [{ type: "tool-searchProperties", state: "input-available", input: {} }],
    } as unknown as UIMessage;
    expect(statuses([msg(["searchProperties", { error: "失敗" }]), pending])).toEqual([
      "current", "todo", "todo", "todo", "todo",
    ]);
  });
});

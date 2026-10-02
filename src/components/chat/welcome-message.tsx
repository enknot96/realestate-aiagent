import { EXAMPLE_PROMPTS } from "@/lib/example-prompts";
import { AssistantAvatar } from "./avatars";

export function WelcomeMessage({ onPickExample }: { onPickExample: (text: string) => void }) {
  return (
    <>
      <div className="flex w-full max-w-[85%] animate-fade-in-up gap-2 self-start">
        <AssistantAvatar />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <div className="w-full rounded-lg bg-gray-100 p-3 text-sm">
            こんにちは！みらいくんです。お住まい探しのご希望や気になることを、お気軽にメッセージしてくださいね。
          </div>
        </div>
      </div>
      {/* 押すとそのまま送信される（ワンクリックでデモを試せる） */}
      <div className="flex flex-wrap gap-2 pl-10">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="cursor-pointer rounded-full border border-brand-teal/40 bg-white px-3 py-1.5 text-left text-sm text-brand-teal transition-colors hover:bg-brand-teal/10"
            onClick={() => onPickExample(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </>
  );
}

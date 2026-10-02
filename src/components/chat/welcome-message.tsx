import { AssistantAvatar } from "./avatars";

export function WelcomeMessage() {
  return (
    <div className="flex w-full max-w-[85%] animate-fade-in-up gap-2 self-start">
      <AssistantAvatar />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <div className="w-full rounded-lg bg-gray-100 p-3 text-sm">
          こんにちは！みらいくんです。お住まい探しのご希望や気になることを、お気軽にメッセージしてくださいね。
        </div>
      </div>
    </div>
  );
}

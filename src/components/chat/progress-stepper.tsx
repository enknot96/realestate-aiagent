import type { UIMessage } from "ai";
import { CheckIcon } from "@/components/icons";
import { deriveProgress } from "./progress";

// 住まい探しの進み具合を示すステッパー。PCは5ステップ横並び、スマホは現在のステップだけラベルを出す
export function ProgressStepper({ messages }: { messages: UIMessage[] }) {
  if (messages.length === 0) return null;
  const steps = deriveProgress(messages);
  const current = steps.find((step) => step.status === "current");

  return (
    <nav
      aria-label="住まい探しの進み具合"
      className="shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2 sm:px-6"
    >
      <ol className="flex items-center">
        {steps.map((step, i) => (
          <li
            key={step.key}
            aria-current={step.status === "current" ? "step" : undefined}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.status === "done"
                  ? "bg-brand-teal text-white"
                  : step.status === "current"
                    ? "bg-brand-navy text-white ring-2 ring-brand-teal/40"
                    : "border border-gray-300 bg-white text-gray-400"
              }`}
            >
              {step.status === "done" ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
              <span className="sr-only">
                {step.label}（{step.status === "done" ? "完了" : step.status === "current" ? "現在" : "未着手"}）
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`ml-1.5 text-xs whitespace-nowrap ${
                step.status === "current" ? "font-bold text-brand-navy" : "hidden text-gray-500 md:inline"
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-1.5 h-0.5 min-w-2 flex-1 rounded ${
                  step.status === "done" ? "bg-brand-teal" : "bg-gray-300"
                }`}
              />
            )}
          </li>
        ))}
      </ol>
      {current === undefined && (
        <p className="sr-only">すべてのステップが完了しました</p>
      )}
    </nav>
  );
}

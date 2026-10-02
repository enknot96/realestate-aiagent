import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatBubbleIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { ChatPreview } from "./chat-preview";

const STEPS: { title: string; icon: ReactNode; body: string }[] = [
  {
    title: "話しかける",
    icon: <ChatBubbleIcon className="h-6 w-6" />,
    body: "「予算8万円・ペット可の2LDK」のように、ふだんの言葉で希望を伝えるだけ。",
  },
  {
    title: "探して、提案する",
    icon: <SearchIcon className="h-6 w-6" />,
    body: "実際の物件データから探します。見つからないときは予算を少し上げるなど条件を1つずつ緩めて探し直し、何をどう緩めたかを正直にお伝えします。「ペット可」のようなこだわりは勝手に外しません。",
  },
  {
    title: "内見の日時を選ぶ",
    icon: <CalendarIcon className="h-6 w-6" />,
    body: "空いている枠がボタンで表示されます。タップで選ぶだけです。",
  },
  {
    title: "あなたが確認してから確定",
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    body: "問い合わせや予約は、内容を確認カードでお見せします。あなたが「承認」を押すまで、実行されることはありません。",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title">
      <div className="mb-8 text-center">
        <p className="text-sm font-bold tracking-wider text-brand-teal">HOW IT WORKS</p>
        <h2 id="how-it-works-title" className="mt-1 text-2xl font-bold">
          みらいくんにできること
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          会話するだけで、住まい探しから内見の予約まで進みます。
        </p>
      </div>

      <ol className="grid gap-4 lg:grid-cols-4 lg:gap-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 lg:flex-col lg:gap-3">
            {/* ステップ同士をつなぐ線（スマホは縦、PCは横。最後のステップには付けない） */}
            {i < STEPS.length - 1 && (
              <>
                <span
                  className="absolute top-12 bottom-[-1rem] left-6 w-0.5 -translate-x-1/2 bg-brand-teal/30 lg:hidden"
                  aria-hidden="true"
                />
                <span
                  className="absolute top-6 left-14 hidden h-0.5 w-[calc(100%-2.5rem+1.5rem)] -translate-y-1/2 bg-brand-teal/30 lg:block"
                  aria-hidden="true"
                />
                <ArrowRightIcon className="absolute top-6 -right-6 z-10 hidden h-5 w-5 -translate-y-1/2 text-brand-teal lg:block" />
              </>
            )}
            <span className="brand-gradient relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-md">
              {step.icon}
            </span>
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold">
                <span className="mr-2 text-sm whitespace-nowrap text-brand-teal">STEP {i + 1}</span>
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <ChatPreview />
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/chat"
          className="group flex items-center gap-2 rounded-lg bg-brand-teal px-8 py-3 text-sm font-bold text-white hover:bg-brand-navy"
        >
          みらいくんに相談する
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

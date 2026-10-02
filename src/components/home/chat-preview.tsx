import Image from "next/image";
import { CalendarIcon, CheckIcon } from "@/components/icons";

// 実際のチャット画面の雰囲気を再現した静的な図（ホームではAIを呼ばない）
export function ChatPreview() {
  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
      role="img"
      aria-label="みらいくんとのチャット例。希望を伝えると物件が提案され、承認カードで内容を確認できます"
    >
      <div className="flex flex-col gap-3 text-sm" aria-hidden="true">
        <div className="self-end rounded-lg bg-brand-teal/10 px-3 py-2">
          予算8万円・ペット可の2LDKで探して
        </div>

        <div className="flex items-start gap-2">
          <Image
            src="/miraikun.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <div className="rounded-lg bg-gray-100 px-3 py-2">
            条件に合う物件が3件ありました。内見できる日時も選べます。
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["7/28 10:00", "7/28 14:00", "7/29 11:00"].map((slot) => (
                <span
                  key={slot}
                  className="rounded-full border border-brand-teal px-2.5 py-0.5 text-xs text-brand-teal"
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 font-bold text-amber-900">
            <CalendarIcon className="h-4 w-4" />
            内見予約の確認
          </p>
          <p className="mt-1 text-xs text-gray-700">7/28(火) 14:00 ・ 渋谷区 2LDK</p>
          <div className="mt-2 flex gap-2">
            <span className="flex items-center gap-1 rounded-md bg-brand-teal px-3 py-1 text-xs font-bold text-white">
              <CheckIcon className="h-3.5 w-3.5" />
              承認
            </span>
            <span className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600">
              やめる
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { PropertyImportDemo } from "@/components/property-import/property-import-demo";

export const metadata: Metadata = {
  title: "物件資料の読み取りデモ（事業者向け） | みらい不動産",
  description: "物件資料の画像から、AIが物件情報を読み取って登録の下書きを作る営業ツールのデモです。",
  // 営業向けのデモのため、検索エンジンには載せない
  robots: { index: false, follow: false },
};

export default function PropertyImportPage() {
  return (
    <main className="flex w-full flex-col">
      <section className="brand-gradient px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold">事業者向けデモ</span>
          <h1 className="text-2xl font-bold sm:text-4xl">
            営業ツールのデモ: 物件資料から登録の下書きを作る
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/90">
            図面・チラシ・マイソクの画像をアップロードすると、AIが物件情報を読み取り、紹介文まで作って登録の下書きを出します。
            手入力の手間を減らし、担当者は「要確認」の項目を見比べるだけで済みます。
          </p>
          <p className="max-w-3xl rounded-lg bg-white/15 px-3 py-2 text-xs">
            デモのため、アップロードした画像は保存せず、物件の登録も行いません。
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl p-6 py-10">
        <PropertyImportDemo />
      </div>
    </main>
  );
}

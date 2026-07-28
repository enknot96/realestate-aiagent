import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "お問い合わせ | みらい不動産",
  description:
    "みらい不動産へのお問い合わせはこちらから。オンライン相談やLINEでのご相談も承っております。",
};

export default function ContactPage() {
  return (
    <main className="flex w-full flex-col">
      <section
        className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-cover bg-center px-6 py-16 text-center text-white sm:min-h-[420px]"
        style={{ backgroundImage: "url(/contact-hero.jpeg)" }}
      >
        {/* 背景画像が未配置の間もbrand-gradient相当の見た目になる半透明グラデーション */}
        <div className="brand-gradient-overlay absolute inset-0" aria-hidden="true" />
        <h1 className="relative text-2xl font-bold sm:text-4xl">お問い合わせ</h1>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">フォームでのお問い合わせ</h2>
          <ContactForm />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <h2 className="text-sm font-bold text-gray-700">オンライン相談予約</h2>
            <p className="text-xs text-gray-500">Zoom / Google Meetでの相談予約（近日公開）</p>
            <button
              type="button"
              disabled
              className="w-full rounded-lg bg-brand-teal px-4 py-2 text-sm font-bold text-white opacity-50"
            >
              オンライン相談を予約する
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <h2 className="text-sm font-bold text-gray-700">LINEでお気軽に相談</h2>
            <div className="flex h-28 w-28 flex-col items-center justify-center gap-0.5 rounded bg-gray-100 text-xs text-gray-400">
              <span>QRコード</span>
              <span>準備中</span>
            </div>
            <p className="text-xs text-gray-500">友だち追加はこちらから（準備中）</p>
          </div>
        </div>
      </div>
    </main>
  );
}

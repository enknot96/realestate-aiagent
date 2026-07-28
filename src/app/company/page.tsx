import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "会社概要 | みらい不動産",
  description: "みらい不動産株式会社の会社概要をご紹介します。",
};

const COMPANY_INFO: { label: string; value: string | string[] }[] = [
  { label: "会社名", value: "みらい不動産株式会社（Mirai Real Estate Co., Ltd.）" },
  { label: "設立", value: "2020年4月" },
  { label: "所在地", value: "〒150-0002 東京都渋谷区渋谷2-21-1 みらいビル 3F" },
  { label: "代表者", value: "代表取締役 未来 拓也（みらい たくや）" },
  {
    label: "事業内容",
    value: [
      "不動産売買・賃貸の仲介および管理",
      "リノベーションの企画・設計",
      "スマートホーム導入コンサルティング",
    ],
  },
  { label: "免許番号", value: "東京都知事 (1) 第102345号" },
];

export default function CompanyPage() {
  return (
    <main className="flex w-full flex-col">
      <section
        className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-cover bg-center px-6 py-16 text-center text-white sm:min-h-[420px]"
        style={{ backgroundImage: "url(/company-hero.jpeg)" }}
      >
        {/* 背景画像が未配置の間もbrand-gradient相当の見た目になる半透明グラデーション */}
        <div className="brand-gradient-overlay absolute inset-0" aria-hidden="true" />
        <h1 className="relative text-2xl font-bold sm:text-4xl">会社概要</h1>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 py-12">
        <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {COMPANY_INFO.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:gap-6">
              <dt className="w-full shrink-0 font-bold text-gray-500 sm:w-32">{item.label}</dt>
              <dd className="text-gray-800">
                {Array.isArray(item.value) ? (
                  <ul className="list-disc space-y-0.5 pl-4">
                    {item.value.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}

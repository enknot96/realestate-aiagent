import Link from "next/link";
import { realestateApiFetch } from "@/lib/realestateApi";
import { PropertyCard } from "@/components/property";
import { PropertySearchForm } from "@/components/property-search-form";
import { ArrowRightIcon, BellIcon, SearchIcon, StarIcon } from "@/components/icons";
import { HeroChatEntry } from "@/components/home/hero-chat-entry";
import { HowItWorks } from "@/components/home/how-it-works";
import type { PropertyListResponse } from "@/lib/property";

// 今回はCMS等を持たないため、ダミーの固定文言を表示する（今後のタスクで見直し予定）
const NEWS_ITEMS = [
  { date: "2026.10.03", text: "本社を兵庫県西宮市に移転しました。" },
  { date: "2026.10.03", text: "関西エリア（大阪・京都・兵庫）の売買物件（土地・中古戸建・中古マンション）を掲載しました。" },
  { date: "2026.07.20", text: "AIエージェント「みらいくん」がオンライン内見予約に対応しました。" },
  { date: "2026.07.05", text: "渋谷区・世田谷区エリアの新着物件を追加しました。" },
  { date: "2026.06.15", text: "「みらい不動産」サイトをリニューアルオープンしました。" },
];

async function fetchRecommended() {
  try {
    const data = await realestateApiFetch<PropertyListResponse>("/properties?limit=4");
    return data.properties;
  } catch {
    // ④が一時的に落ちていても、おすすめ物件を非表示にしてHome自体は表示する
    return [];
  }
}

export default async function HomePage() {
  const recommended = await fetchRecommended();

  return (
    <main className="flex w-full flex-col">
      <section
        className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-cover bg-center px-6 pt-16 pb-28 text-center text-white sm:min-h-[480px] sm:pb-36"
        style={{ backgroundImage: "url(/home-hero.jpeg)" }}
      >
        {/* 背景画像が未配置の間もbrand-gradient相当の見た目になる半透明グラデーション */}
        <div
          className="brand-gradient-overlay absolute inset-0"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
          <h1 className="text-3xl font-bold sm:text-5xl">探すから、 話せるへ。</h1>
          <p className="text-sm text-white/90 sm:text-base">
            AIエージェント「みらいくん」との会話で、
            <br />
            あなたにぴったりの住まいが見つかります。
          </p>
          <HeroChatEntry />
        </div>
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pt-6 pb-24">
        <section className="-mt-12 rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:-mt-16">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-700">
            <SearchIcon className="h-4 w-4 text-brand-teal" />
            物件を探す
          </h2>
          <PropertySearchForm variant="compact" />
        </section>

        <HowItWorks />

        {recommended.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <StarIcon className="h-5 w-5 text-brand-teal" />
                おすすめ物件
              </h2>
              <Link
                href="/properties"
                className="group flex items-center gap-1 text-sm font-bold text-brand-teal hover:text-brand-navy"
              >
                物件を探す
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {recommended.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <BellIcon className="h-5 w-5 text-brand-teal" />
            お知らせ・トピックス
          </h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {NEWS_ITEMS.map((item) => (
              <li
                key={item.date}
                className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:gap-4"
              >
                <span className="shrink-0 text-gray-500">{item.date}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

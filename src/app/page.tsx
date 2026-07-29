import Link from "next/link";
import { realestateApiFetch } from "@/lib/realestateApi";
import { PropertyCard } from "@/components/property";
import { ArrowRightIcon, BellIcon, SearchIcon, StarIcon } from "@/components/icons";
import type { PropertyListResponse } from "@/lib/property";

// 今回はCMS等を持たないため、ダミーの固定文言を表示する（今後のタスクで見直し予定）
const NEWS_ITEMS = [
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
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
          <h1 className="text-3xl font-bold sm:text-5xl">探すから、 話せるへ。</h1>
          <p className="text-sm text-white/90 sm:text-base">
            AIエージェント「みらいくん」との会話で、
            <br />
            あなたにぴったりの住まいが見つかります。
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pt-6 pb-24">
        <section className="-mt-12 rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:-mt-16">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-700">
            <SearchIcon className="h-4 w-4 text-brand-teal" />
            物件を探す
          </h2>
          <form
            action="/properties"
            method="get"
            className="flex flex-wrap gap-2 text-sm"
          >
            <select
              name="type"
              defaultValue=""
              className="min-w-[8rem] flex-1 rounded border border-gray-300 p-1.5"
            >
              <option value="">種別: 指定なし</option>
              <option value="rent">賃貸</option>
              <option value="sale">売買</option>
            </select>
            <input
              name="minPrice"
              type="number"
              placeholder="下限価格"
              className="min-w-[7rem] flex-1 rounded border border-gray-300 p-1.5"
            />
            <input
              name="maxPrice"
              type="number"
              placeholder="上限価格"
              className="min-w-[7rem] flex-1 rounded border border-gray-300 p-1.5"
            />
            <input
              name="layout"
              type="text"
              placeholder="間取り (例: 2LDK)"
              className="min-w-[8rem] flex-1 rounded border border-gray-300 p-1.5"
            />
            <input
              name="keyword"
              type="text"
              placeholder="キーワード (例: ペット可)"
              className="min-w-[9rem] flex-1 rounded border border-gray-300 p-1.5"
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded bg-brand-teal px-4 py-1.5 text-white hover:bg-brand-navy"
            >
              検索
            </button>
          </form>
        </section>

        {recommended.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <StarIcon className="h-5 w-5 text-brand-teal" />
                おすすめ物件ピックアップ
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

        <section className="flex flex-col items-center gap-3 rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-6 text-center">
          <h2 className="text-lg font-bold">条件が決まっていなくても大丈夫。</h2>
          <p className="text-sm text-gray-600">
            AIエージェント「みらいくん」に相談すれば、希望条件のヒアリングから物件提案・内見予約まで会話でお任せできます。
          </p>
          <Link
            href="/chat"
            className="rounded-lg bg-brand-teal px-6 py-2 text-sm font-bold text-white hover:bg-brand-navy"
          >
            みらいくんに相談する
          </Link>
        </section>
      </div>
    </main>
  );
}

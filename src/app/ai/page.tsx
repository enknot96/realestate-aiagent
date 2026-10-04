import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CalculatorIcon,
  ChatBubbleIcon,
  CheckIcon,
  ClockIcon,
  DocumentIcon,
  DocumentSearchIcon,
  MapPinIcon,
  SendIcon,
  ShieldCheckIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "AIの取り組み | みらい不動産",
  description:
    "AIエージェント「みらいくん」、エリア診断、物件資料の読み取りなど、みらい不動産のAIの取り組みと、AIを使ううえでの方針をご紹介します。",
};

const PRINCIPLES: { title: string; icon: ReactNode; body: string }[] = [
  {
    title: "数字はAIに計算させない",
    icon: <CalculatorIcon className="h-6 w-6" />,
    body: "ローンの返済額やエリアのスコアは、プログラムで正確に計算します。AIが担うのは、何を調べるかの判断と、結果を分かりやすく伝えることです。",
  },
  {
    title: "大事な操作は人が確認する",
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    body: "内見の予約などは、お客様が内容を確認してから確定します。資料の読み取り結果も、推測した項目は「要確認」としてお示しします。",
  },
  {
    title: "根拠を示す",
    icon: <DocumentSearchIcon className="h-6 w-6" />,
    body: "「駅まで徒歩何分か」「どの物件の情報か」など、答えの元になったデータをお示しし、確かめられる形でお伝えします。",
  },
];

type Feature = {
  title: string;
  lead: string;
  points: string[];
  // public/ 配下の画像。未配置の間は、グラデーションとアイコンの仮表示が見える
  image: string;
  imageAlt: string;
  icon: ReactNode;
  // href が無いものは公開準備中として、押せないボタンを出す。external は別の作品（別サイト）へのリンク
  cta: { label: string; href?: string; external?: { note: string } };
};

const CUSTOMER_FEATURES: Feature[] = [
  {
    title: "AIエージェント「みらいくん」",
    lead: "「駅近で2LDK、ペット可」のように話しかけるだけで、条件に合う物件を探し、内見の予約まで進められます。",
    points: [
      "見つからないときは条件を1つずつ緩めて探し直し、何を緩めたかをお伝えします",
      "住宅ローンの返済額を、変動金利と固定金利で並べて試算します",
      "お問い合わせや内見の予約は、内容をご確認いただいてから確定します",
    ],
    image: "/ai-chat.jpeg",
    imageAlt: "みらいくんと会話しながら住まいを探す様子",
    icon: <ChatBubbleIcon className="h-14 w-14" />,
    cta: { label: "みらいくんに相談する", href: "/chat" },
  },
  {
    title: "エリア診断",
    lead: "住所と「車がないけど大丈夫？」「保育園に寄って8:30に駅に着きたい」といった暮らしの不安を伝えると、AIが必要な調査を自分で判断し、地図とスコアでお答えします。",
    points: [
      "保育園に寄ってからの出勤など、毎日の動線から出発時刻を逆算します",
      "近くに施設が見つからなければ、範囲を広げて探し直します",
      "子育て・単身・シニア・投資の目線を切り替えると、同じ場所の評価が変わります",
    ],
    image: "/ai-area.jpeg",
    imageAlt: "地図上で周辺施設と生活動線を調べる様子",
    icon: <MapPinIcon className="h-14 w-14" />,
    cta: { label: "公開準備中" },
  },
];

const BUSINESS_FEATURES: Feature[] = [
  {
    title: "物件資料の読み取り",
    lead: "他社から届いた図面・チラシ・マイソクの画像から物件情報を読み取り、紹介文まで作った「登録の下書き」をお出しします。自社サイトへの掲載や、土地探しのお客様への提案のための転記作業を減らす営業ツールです。",
    points: [
      "読み取りに自信がない項目は「要確認」で強調し、担当者は資料と見比べるだけで済みます",
      "紹介文は資料に書かれた事実だけで作り、誇大な表現を避けます",
      "スマホで撮った写真もそのまま使え、画像は保存しません",
    ],
    image: "/ai-import.jpeg",
    imageAlt: "物件資料の画像から登録の下書きを作る様子",
    icon: <DocumentIcon className="h-14 w-14" />,
    cta: { label: "デモを試す", href: "/tools/property-import" },
  },
  {
    title: "マイソク作成・LINE配信",
    lead: "登録済みの物件データからマイソク（物件資料）を組み立て、担当者が確認したうえでLINEでお客様にお届けします。物件資料の読み取りとは逆向きの、「データから資料をつくる」営業ツールです。",
    points: [
      "用途地域・学区・ハザード情報などを、公的なデータから自動で取り込みます",
      "AIが紹介文の下書きを作り、広告で使えない表現は保存の前に止めます",
      "担当者が承認してから、「買主」などのタグを付けたお客様にLINEで配信します",
    ],
    image: "/ai-maisoku.jpeg",
    imageAlt: "物件データからマイソクを作り、LINEでお客様に届ける様子",
    icon: <SendIcon className="h-14 w-14" />,
    cta: {
      label: "CRMのデモを開く",
      href: "https://crm-realestate-vert.vercel.app",
      external: { note: "別サイト（みらい不動産 CRM）が開きます。ログイン画面のボタンからそのまま入れます。" },
    },
  },
];

function FeatureRow({ feature, reverse }: { feature: Feature; reverse: boolean }) {
  const comingSoon = !feature.cta.href;
  return (
    <article className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-xl shadow-md ${reverse ? "md:order-last" : ""}`}>
        {/* 画像が未配置・読み込み失敗の間は、下のグラデーションとアイコンが見える */}
        <div className="brand-gradient absolute inset-0 flex items-center justify-center text-white/80" aria-hidden="true">
          {feature.icon}
        </div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${feature.image})` }}
          role="img"
          aria-label={feature.imageAlt}
        />
        {comingSoon && (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-navy shadow-sm">
            <ClockIcon className="h-3.5 w-3.5" />
            公開準備中
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">{feature.title}</h3>
        <p className="text-sm leading-relaxed text-gray-700 sm:text-base">{feature.lead}</p>
        <ul className="flex flex-col gap-2">
          {feature.points.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-gray-700">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
              {point}
            </li>
          ))}
        </ul>
        {feature.cta.href && feature.cta.external ? (
          <div className="flex flex-col gap-1.5">
            <a
              href={feature.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-fit items-center gap-2 rounded-lg bg-brand-teal px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
            >
              {feature.cta.label}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <p className="text-xs text-gray-500">{feature.cta.external.note}</p>
          </div>
        ) : feature.cta.href ? (
          <Link
            href={feature.cta.href}
            className="group flex w-fit items-center gap-2 rounded-lg bg-brand-teal px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
          >
            {feature.cta.label}
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-fit cursor-not-allowed items-center gap-2 rounded-lg bg-gray-300 px-5 py-3 text-sm font-bold text-white"
          >
            <ClockIcon className="h-4 w-4" />
            {feature.cta.label}
          </button>
        )}
      </div>
    </article>
  );
}

function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  features,
  offset = 0,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  features: Feature[];
  // セクションをまたいでも画像の左右が交互になるよう、通し番号の開始位置を受け取る
  offset?: number;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-10 text-center">
        <p className="text-sm font-bold tracking-wider text-brand-teal">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl font-bold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
      <div className="flex flex-col gap-16">
        {features.map((feature, i) => (
          <FeatureRow key={feature.title} feature={feature} reverse={(offset + i) % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

export default function AiPage() {
  return (
    <main className="flex w-full flex-col">
      <section
        className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-cover bg-center px-6 py-16 text-center text-white sm:min-h-[420px]"
        style={{ backgroundImage: "url(/ai-hero.jpeg)" }}
      >
        {/* 背景画像が未配置の間もbrand-gradient相当の見た目になる半透明グラデーション */}
        <div className="brand-gradient-overlay absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-4xl">AIの取り組み</h1>
          <p className="text-sm text-white/90 sm:text-base">
            テクノロジーで、
            {/* スマホでは「仕事 / を、」のような途中での折り返しを避け、読点の位置で改行する */}
            <br className="sm:hidden" />
            住まい探しと不動産の仕事を、もっと確かに。
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-16">
        <section aria-labelledby="principles-title">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold tracking-wider text-brand-teal">OUR POLICY</p>
            <h2 id="principles-title" className="mt-1 text-2xl font-bold">
              私たちのAIの使い方
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              AIに任せることと、任せないことを決めています。
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
            {PRINCIPLES.map((principle) => (
              <li
                key={principle.title}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md">
                  {principle.icon}
                </span>
                <h3 className="font-bold">{principle.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{principle.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <FeatureSection
          id="customer-title"
          eyebrow="FOR CUSTOMERS"
          title="お客様向け"
          description="住まい探しの「分からない」を、会話と地図で解きほぐします。"
          features={CUSTOMER_FEATURES}
        />

        <FeatureSection
          id="business-title"
          eyebrow="FOR BUSINESS"
          title="事業者向け"
          description="不動産会社の日々の手間を減らす、営業ツールのデモです。"
          features={BUSINESS_FEATURES}
          offset={CUSTOMER_FEATURES.length}
        />
      </div>
    </main>
  );
}

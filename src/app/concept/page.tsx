import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "みらい不動産について | みらい不動産",
  description:
    "「変わる暮らしに、変わらない安心を。」みらい不動産の設立ストーリーと、私たちが目指す住まい探しの形をご紹介します。",
};

const STORY_PARAGRAPHS = [
  "代表は元々IT業界の出身。自身が引っ越しをする際、不動産業界のアナログな手続きや情報の不透明さに疑問を抱きました。",
  "「テクノロジーをもっと活用すれば、住まい探しはもっとワクワクして、安心できるものになるはずだ」。その想いから立ち上げたのが「みらい不動産」です。",
  "私たちは、AIを活用したあなたにぴったりの物件マッチングや、自宅からできるVR内見、ペーパーレスなオンライン契約をいち早く導入。単なる場所貸しではなく、あなたの「未来のライフスタイル」をデザインするパートナーでありたいと考えています。",
];

export default function ConceptPage() {
  return (
    <main className="flex w-full flex-col">
      <section
        className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-cover bg-center px-6 py-16 text-center text-white sm:min-h-[420px]"
        style={{ backgroundImage: "url(/concept-hero.jpeg)" }}
      >
        {/* 背景画像が未配置の間もbrand-gradient相当の見た目になる半透明グラデーション */}
        <div className="brand-gradient-overlay absolute inset-0" aria-hidden="true" />
        <h1 className="relative text-2xl font-bold sm:text-4xl">
          変わる暮らしに、変わらない安心を。
        </h1>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-6 py-12">
        <div className="flex flex-col gap-4">
          {STORY_PARAGRAPHS.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-gray-700 sm:text-base">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <div
            className="h-24 w-24 shrink-0 rounded-full bg-gray-200 bg-cover bg-center"
            style={{ backgroundImage: "url(/concept-founder.jpeg)" }}
            role="img"
            aria-label="代表取締役 未来 拓也"
          />
          <div>
            <p className="font-bold">代表取締役 未来 拓也</p>
            <p className="mt-1 text-sm text-gray-600">
              テクノロジーの力で、住まい探しをもっとワクワクするものに。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

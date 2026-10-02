import Image from "next/image";
import Link from "next/link";

function chatHref(text: string) {
  return `/chat?ask=${encodeURIComponent(text)}`;
}

// 詳細ページのAI相談導線。主（内見）と副（質問）で強弱をつけ、どちらも /chat の入力欄にプレフィルする（自動送信はしない）
export function PropertyConsultCta({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Link
        href={chatHref(`「${title}」の内見を希望します。空いている日時を教えてください`)}
        className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-3 text-center text-sm font-bold text-white hover:bg-brand-navy"
      >
        <Image
          src="/miraikun.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
        内見を相談する
      </Link>
      <Link
        href={chatHref(`「${title}」について質問があります。`)}
        className="flex items-center justify-center gap-2 rounded-lg border border-brand-teal bg-white px-4 py-3 text-center text-sm font-bold text-brand-teal hover:bg-brand-teal/10"
      >
        <Image
          src="/miraikun.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
        この物件について質問する
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import { ChatFab } from "@/components/chat-fab";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

// 日本語のsubsetは指定できないため latin のみプリロードし、和文グリフはGoogle Fontsのunicode-range分割で配信される
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku-gothic-new",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "物件を自分で探すか、AIエージェント「みらいくん」に任せるか。両方できる不動産サイト、みらい不動産。";

export const metadata: Metadata = {
  metadataBase: new URL("https://realestate-aiagent.vercel.app"),
  title: "みらい不動産",
  description: DESCRIPTION,
  openGraph: {
    siteName: "みらい不動産",
    locale: "ja_JP",
    type: "website",
    title: "みらい不動産",
    description: DESCRIPTION,
    images: [{ url: "/home-hero.jpeg", width: 1200, height: 630, alt: "みらい不動産" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "みらい不動産",
    description: DESCRIPTION,
    images: ["/home-hero.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenKakuGothicNew.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="みらい不動産"
                width={1024}
                height={350}
                className="h-12 w-auto sm:h-14 lg:h-16"
                priority
              />
            </Link>
            <SiteNav />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <ChatFab />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "不動産AIエージェント",
  description: "物件を自分で探すか、AIエージェントに任せるか。両方できる不動産サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-3">
            <span className="font-bold">不動産AIエージェント</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/properties" className="text-gray-600 hover:text-blue-600">
                物件を探す
              </Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                AIエージェントに相談する
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}

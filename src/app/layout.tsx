import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
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
  title: "みらい不動産",
  description:
    "物件を自分で探すか、AIエージェント「みらいくん」に任せるか。両方できる不動産サイト、みらい不動産。",
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
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-full.png"
                alt="みらい不動産"
                width={1024}
                height={350}
                className="h-20 w-auto"
                priority
              />
            </Link>
            <SiteNav />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} みらい不動産株式会社
        </footer>
      </body>
    </html>
  );
}

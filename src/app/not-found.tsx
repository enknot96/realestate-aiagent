import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = {
  title: "ページが見つかりません | みらい不動産",
};

export default function NotFound() {
  return (
    <NotFoundView
      title="お探しのページは見つかりませんでした"
      message="URLが変更されたか、ページが削除された可能性があります。物件探しはこちらからどうぞ。"
      showHome
    />
  );
}

import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = {
  title: "物件が見つかりません | みらい不動産",
};

export default function PropertyNotFound() {
  return (
    <NotFoundView
      title="お探しの物件は見つかりませんでした"
      message="掲載が終了した可能性があります。条件を変えて探すか、みらいくんにご相談ください。"
    />
  );
}

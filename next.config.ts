import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 「会社概要」は「みらい不動産について」に統合した。外部からの旧URLへのリンクを生かすため恒久転送する
      { source: "/company", destination: "/concept", permanent: true },
    ];
  },
};

export default nextConfig;

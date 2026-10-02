// 一覧の取得中に表示するスケルトン（カードグリッドと同じ配置）
export default function Loading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6"
      aria-busy="true"
      aria-label="物件を読み込み中"
    >
      <div className="h-7 w-40 rounded bg-gray-200 motion-safe:animate-pulse" />
      <div className="h-24 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white motion-safe:animate-pulse"
          >
            <div className="aspect-[4/3] w-full bg-gray-200" />
            <div className="flex flex-col gap-2 p-3">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-5 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

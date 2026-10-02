// 詳細ページのレイアウトに沿ったスケルトン
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-6" aria-busy="true">
      <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="flex flex-col gap-3 self-start rounded-lg border border-gray-200 bg-white p-4">
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-16 w-full animate-pulse rounded bg-gray-100" />
          <div className="hidden h-24 w-full animate-pulse rounded bg-gray-100 lg:block" />
        </div>
      </div>
    </main>
  );
}

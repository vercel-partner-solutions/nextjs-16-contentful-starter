export function ArticleContentSkeleton() {
  return (
    <article>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-6 w-24 bg-gradient-to-r from-black/5 to-black/10 animate-pulse" />
        <div className="h-4 w-28 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
      </div>

      <div className="space-y-3 mb-6">
        <div className="h-12 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-12 w-3/4 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
      </div>

      <div className="h-5 w-32 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded mb-12" />

      <div className="relative w-full aspect-[2/1] mb-12 bg-gradient-to-r from-black/5 to-black/10 animate-pulse border border-black/5 shadow-sm" />

      <div className="mb-12 pb-12 border-b border-black/10 space-y-3">
        <div className="h-6 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-6 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-6 w-4/5 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        <div className="h-4 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-4 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-4 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
        <div className="h-4 w-4/5 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
      </div>
    </article>
  );
}

export function SuggestedArticleSkeleton() {
  return (
    <section className="mt-24 pt-16 border-t border-black/10">
      <div className="h-9 w-32 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded mb-12" />

      <div className="block border border-black/5 overflow-hidden bg-white">
        <div className="flex flex-col gap-6 p-8">
          <div className="relative w-full aspect-[2/1] bg-gradient-to-r from-black/5 to-black/10 animate-pulse" />

          <div className="space-y-4">
            <div className="h-6 w-24 bg-gradient-to-r from-black/5 to-black/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-7 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
              <div className="h-7 w-3/4 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-5 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
              <div className="h-5 w-full bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
              <div className="h-5 w-2/3 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
            </div>
            <div className="h-4 w-28 bg-gradient-to-r from-black/5 to-black/10 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

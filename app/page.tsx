import { getArticles } from "@/lib/contentful/queries";
import { ContentfulImage } from "@/components/contentful-image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Suspense fallback={<ArticlesSkeleton />}>
        <Articles />
      </Suspense>
    </main>
  );
}

async function Articles() {
  const { isEnabled } = await draftMode();
  const articles = await getArticles(isEnabled);

  return (
    <>
      {articles.map((article) => (
        <Link key={article.slug} href={`/articles/${article.slug}`}>
          <article className="group mb-8 bg-white border border-black/5 overflow-hidden shadow-sm hover:shadow-xl hover:border-black/10 transition-all duration-300">
            <div className="relative w-full aspect-[2/1] overflow-hidden bg-black/5">
              <ContentfulImage
                src={article.articleImage?.fields?.file?.url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black text-white">
                  {article.categoryName}
                </span>
                <span className="text-sm text-black/50">
                  {article.authorName}
                </span>
              </div>

              <h2 className="text-3xl font-semibold text-black mb-4 text-balance leading-tight group-hover:text-black/80 transition-colors">
                {article.title}
              </h2>

              <p className="text-base text-black/60 leading-relaxed text-pretty">
                {article.summary}
              </p>
            </div>
          </article>
        </Link>
      ))}
    </>
  );
}

function ArticlesSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <article
          key={i}
          className="mb-8 bg-white border border-black/5 overflow-hidden shadow-sm"
        >
          {/* Image skeleton */}
          <div className="relative w-full aspect-[2/1] overflow-hidden bg-black/5">
            <div className="w-full h-full bg-gradient-to-r from-black/5 via-black/10 to-black/5 animate-pulse" />
          </div>

          <div className="p-10">
            {/* Category and author skeleton */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-6 w-24 bg-black/10 animate-pulse" />
              <div className="h-4 w-32 bg-black/5 animate-pulse" />
            </div>

            {/* Title skeleton */}
            <div className="mb-4 space-y-2">
              <div className="h-9 w-full bg-black/10 animate-pulse" />
              <div className="h-9 w-3/4 bg-black/10 animate-pulse" />
            </div>

            {/* Summary skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-black/5 animate-pulse" />
              <div className="h-4 w-full bg-black/5 animate-pulse" />
              <div className="h-4 w-2/3 bg-black/5 animate-pulse" />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

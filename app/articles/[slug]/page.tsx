import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Article, getAllArticles, getArticle } from "@/lib/api";
import Image from "next/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { getFormattedDate } from "@/lib/utils";

export async function generateStaticParams() {
  const allArticles = await getAllArticles();

  return allArticles.map((article: Article) => ({
    slug: article.slug,
  }));
}

export default async function KnowledgeArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { isEnabled } = await draftMode();
  const article = await getArticle(params.slug, isEnabled);

  if (!article) {
    notFound();
  }

  const {
    title,
    categoryName,
    authorName,
    date,
    summary,
    details,
    articleImage,
    slug,
  } = article;
  const formattedDate = getFormattedDate(date);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <article>
        <div className="flex items-center gap-4 mb-8">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black text-white">
            {categoryName}
          </span>
          {formattedDate && (
            <time className="text-sm text-black/50">{formattedDate}</time>
          )}
        </div>

        <h1 className="text-5xl font-semibold text-black mb-6 text-balance leading-tight">
          {title}
        </h1>

        <p className="text-lg text-black/60 mb-12">By {authorName}</p>

        <div className="relative w-full aspect-[2/1] mb-12 overflow-hidden bg-black/5 border border-black/5 shadow-sm">
          <Image
            src={articleImage?.url || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
          />
        </div>

        <div className="mb-12 pb-12 border-b border-black/10">
          <p className="text-xl text-black/80 leading-relaxed text-pretty font-medium">
            {summary}
          </p>
        </div>

        <div
          className="prose prose-lg max-w-none"
          style={{
            color: "rgb(0 0 0 / 0.8)",
          }}
        >
          {documentToReactComponents(details.json)}
        </div>
      </article>

      <SuggestedArticle currentSlug={slug} />

      <div className="mt-16 pt-12 border-t border-black/10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black/60 hover:text-black transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          <span>Back to all articles</span>
        </Link>
      </div>
    </main>
  );
}

async function SuggestedArticle({ currentSlug }: { currentSlug: string }) {
  const allArticles = await getAllArticles();
  const otherArticles = allArticles.filter(
    (a: Article) => a.slug !== currentSlug
  );

  // Use the current slug to deterministically select a suggested article
  // This provides variety (different articles suggest different content) while being pure
  const slugHash = currentSlug
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const suggestedArticle =
    otherArticles.length > 0
      ? otherArticles[slugHash % otherArticles.length]
      : null;

  if (!suggestedArticle) {
    return null;
  }
  const { title, categoryName, authorName, summary, articleImage, slug } =
    suggestedArticle;

  return (
    <section className="mt-24 pt-16 border-t border-black/10">
      <h2 className="text-3xl font-semibold text-black mb-12">For you</h2>
      <Link
        href={`/articles/${slug}`}
        className="group block border border-black/5 overflow-hidden bg-white hover:shadow-lg transition-all duration-300"
      >
        <div className="flex flex-col gap-6 p-8">
          <div className="relative w-full aspect-[2/1] overflow-hidden bg-black/5">
            <Image
              src={articleImage?.url || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black text-white mb-4">
              {categoryName}
            </span>
            <h3 className="text-2xl font-semibold text-black mb-3 group-hover:text-black/70 transition-colors">
              {title}
            </h3>
            <p className="text-base text-black/60 mb-4 leading-relaxed">
              {summary}
            </p>
            <p className="text-sm text-black/50">By {authorName}</p>
          </div>
        </div>
      </Link>
    </section>
  );
}

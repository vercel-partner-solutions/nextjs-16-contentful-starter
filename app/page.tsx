import { getArticles } from "@/lib/contentful/queries";
import { ContentfulImage } from "@/components/contentful-image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Articles />
    </main>
  );
}

async function Articles() {
  const articles = await getArticles();

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

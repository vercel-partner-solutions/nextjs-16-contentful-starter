import { getContentfulClient } from "./client";
import { ArticleQuery, ArticleSkeleton, CONTENT_TYPE_IDS } from "./types";
import { extractArticleFields } from "./utils";
import { cacheTag } from "next/cache";

export const getArticleBySlug = async (slug: string, isDraft?: boolean) => {
  "use cache";
  const client = getContentfulClient(isDraft);
  const entriesResult =
    await client.withoutUnresolvableLinks.getEntries<ArticleSkeleton>({
      content_type: CONTENT_TYPE_IDS.KNOWLEDGE_ARTICLE,
      "fields.slug": slug,
      limit: 1,
    });

  cacheTag("articles", entriesResult?.items?.[0]?.sys?.id);
  return extractArticleFields(entriesResult)?.[0];
};

export const getArticles = async (isDraft?: boolean, query?: ArticleQuery) => {
  "use cache";
  const client = getContentfulClient(isDraft);
  const entriesResult =
    await client.withoutUnresolvableLinks.getEntries<ArticleSkeleton>({
      content_type: CONTENT_TYPE_IDS.KNOWLEDGE_ARTICLE,
      ...query,
    });
  const entries = extractArticleFields(entriesResult);
  cacheTag(
    "articles",
    entriesResult?.items?.map((entry) => entry.sys?.id).join(",")
  );
  return entries;
};

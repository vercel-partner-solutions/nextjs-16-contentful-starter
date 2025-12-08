import { getContentfulClient } from "./client";
import { ArticleQuery, ArticleSkeleton, CONTENT_TYPE_IDS } from "./types";
import { extractArticleFields } from "./utils";
import { cacheTag } from "next/cache";

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

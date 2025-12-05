import type { Document } from "@contentful/rich-text-types";
import { cacheTag } from "next/cache";

// Set a variable that contains all the fields needed for articles when a fetch for
// content is performed
const ARTICLE_GRAPHQL_FIELDS = `
  sys {
    id
  }
  title
  slug
  summary
  details {
    json
    links {
      assets {
        block {
          sys {
            id
          }
          url
          description
        }
      }
    }
  }
  date
  authorName
  categoryName
  articleImage {
    url
  }
`;

export interface Asset {
  sys: {
    id: string;
  };
  url: string;
  description: string;
}

export interface RichTextLinks {
  assets: {
    block: Asset[];
  };
}

export interface RichText {
  json: Document;
  links: RichTextLinks;
}

export interface Article {
  sys: {
    id: string;
  };
  title: string;
  slug: string;
  summary: string;
  details: RichText;
  date: string;
  authorName: string;
  categoryName: string;
  articleImage: {
    url: string;
  };
}

interface ContentfulCollection<T> {
  items: T[];
}

interface FetchResponse<T> {
  data: T;
}

type ArticleCollectionResponse = FetchResponse<{
  knowledgeArticleCollection: ContentfulCollection<Article>;
}>;

async function fetchGraphQL<T>(
  query: string,
  preview = false
): Promise<FetchResponse<T>> {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Switch the Bearer token depending on whether the fetch is supposed to retrieve live
        // Contentful content or draft content
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
      // Associate all fetches for articles with an "articles" cache tag so content can
      // be revalidated or updated from Contentful on publish
      next: { tags: ["articles"] },
    }
  ).then((response) => response.json());
}

function extractArticleEntries(
  fetchResponse: ArticleCollectionResponse
): Article[] {
  return fetchResponse?.data?.knowledgeArticleCollection?.items ?? [];
}

export async function getAllArticles(
  // For this demo set the default limit to always return 3 articles.
  limit = 3,
  // By default this function will return published content but will provide an option to
  // return draft content for reviewing articles before they are live
  isDraftMode = false
) {
  "use cache";
  const articles = await fetchGraphQL<ArticleCollectionResponse["data"]>(
    `query {
        knowledgeArticleCollection(where:{slug_exists: true}, order: date_DESC, limit: ${limit}, preview: ${
      isDraftMode ? "true" : "false"
    }) {
          items {
            ${ARTICLE_GRAPHQL_FIELDS}
          }
        }
      }`,
    isDraftMode
  );
  const entries = extractArticleEntries(articles);
  const allEntryIds = entries.map((entry) => entry.sys.id);
  cacheTag(...allEntryIds, "articles");
  return entries;
}

export async function getArticle(
  slug: string,
  isDraftMode = false
): Promise<Article | undefined> {
  "use cache";

  const article = await fetchGraphQL<ArticleCollectionResponse["data"]>(
    `query {
        knowledgeArticleCollection(where:{slug: "${slug}"}, limit: 1, preview: ${
      isDraftMode ? "true" : "false"
    }) {
          items {
            ${ARTICLE_GRAPHQL_FIELDS}
          }
        }
      }`,
    isDraftMode
  );

  const entry = extractArticleEntries(article)[0];
  cacheTag(entry.sys.id, "articles");
  return entry;
}

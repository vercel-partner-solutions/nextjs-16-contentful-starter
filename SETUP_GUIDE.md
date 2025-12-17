# Integrate Contentful with Next.js 16 Cache Components

Next.js 16 introduced many new features including Cache Components, React Compiler support, and faster development and production builds with Turbopack. These updates give teams building content sites more control over how pages render and refresh content while maintaining high performance. Read the [full Next.js 16 announcement](https://nextjs.org/blog/next-16) for more details.

Among these improvements, **Cache Components** are especially valuable for content-driven applications. They let you choose which components are cached, set how long the cache should live, and attach tags that map to the content they depend on. This enables you to define caching strategies and tags per component rather than for an entire page, giving precise control over when and what updates. It allows content to be rendered extremely fast while still updating the moment an editor clicks "Publish."

This guide walks through creating a Next.js application from scratch that uses Contentful to manage and deliver knowledge base articles. You will build a listing page and an article detail view using Cache Components, and set up on-demand revalidation so updates appear as soon as content is published. You'll also add draft preview support and deploy the finished site to Vercel.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Contentful](#setting-up-contentful)
3. [Create a Next.js Application](#create-a-nextjs-application)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Set Up the Contentful SDK](#set-up-the-contentful-sdk)
6. [Create Components](#create-components)
7. [Build the Homepage](#build-the-homepage)
8. [Add the Article Detail Page](#add-the-article-detail-page)
9. [Render Rich Text Content](#render-rich-text-content)
10. [Enable Cache Components](#enable-cache-components)
11. [Set Up On-Demand Revalidation](#set-up-on-demand-revalidation)
12. [Set Up Draft Mode](#set-up-draft-mode)
13. [Deploy to Vercel](#deploy-to-vercel)
14. [Summary](#summary)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before getting started, ensure you have the following:

- **Node.js 18.17 or later** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js
- **A Contentful account** - [Sign up here](https://www.contentful.com/sign-up/) (free tier available)
- **A Vercel account** - [Sign up here](https://vercel.com/signup) (for deployment)
- **Intermediate knowledge of JavaScript and React** - Familiarity with components, props, and async/await

---

## Setting Up Contentful

We'll use Contentful's Content Delivery API to fetch content. This API is read-only and lets applications retrieve content stored in a Contentful space.

### Step 1: Create a Content Model

Create a new empty space in Contentful and add a content type named `knowledgeArticle` with the following fields:

> **Important:** Ensure you have admin access over your Contentful space.

| Field Name    | Field Type    |
| ------------- | ------------- |
| title         | Short text    |
| slug          | Short text    |
| summary       | Short text    |
| details       | Rich text     |
| date          | Date and time |
| articleImage  | Media         |
| authorName    | Short text    |
| categoryName  | Short text    |

### Step 2: Create Example Content

After saving your `knowledgeArticle` content type, navigate to the **Content** tab. Select **"Add Entry"** and select `knowledgeArticle`. Create at least two example pieces of content so you can test the article listing and navigation.

### Step 3: Set Up the Content Delivery API

Navigate to the API settings in your Contentful dashboard and click **"Add API key"**. For a detailed walkthrough, check out [Contentful's official documentation](https://www.contentful.com/developers/docs/references/authentication/).

Save the following values—you'll need them soon:
- **Space ID**
- **Content Delivery API - access token**
- **Content Preview API - access token**

---

## Create a Next.js Application

In your terminal, navigate to your desired directory and run the following command to create a new Next.js application:

```bash
npx create-next-app@latest contentful-next16 --yes
```

Navigate to your project directory and start the development server to ensure everything was set up correctly:

```bash
cd contentful-next16
npm run dev
```

Open your browser and navigate to `http://localhost:3000`. You should see the default Next.js starter page.

### Install Contentful Dependencies

Install the Contentful SDK and rich text renderer:

```bash
npm install contentful @contentful/rich-text-react-renderer
```

> **Note:** The `@contentful/rich-text-react-renderer` package includes `@contentful/rich-text-types` as a dependency, so you don't need to install it separately.

---

## Configure Environment Variables

Create a `.env.local` file in the project root to store your Contentful secrets. You can find these values in the settings for the API key you created earlier.

```bash
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_access_token
```

We'll add additional secrets later for revalidation and draft mode.

---

## Set Up the Contentful SDK

Create a `lib/contentful` directory in the root of the project. We'll use this directory for all Contentful-specific code.

### Create the Client

Create `lib/contentful/client.ts` which exports the Contentful client:

```typescript
// lib/contentful/client.ts
import { createClient, type ContentfulClientApi } from "contentful";

// Module-level cache persists across warm invocations
const clientCache: {
  published?: ContentfulClientApi<undefined>;
  preview?: ContentfulClientApi<undefined>;
} = {};

export const getContentfulClient = (isDraft?: boolean) => {
  const cacheKey = isDraft ? "preview" : "published";
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  const accessToken = isDraft
    ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
    : process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      isDraft
        ? "CONTENTFUL_PREVIEW_ACCESS_TOKEN must be set"
        : "CONTENTFUL_ACCESS_TOKEN must be set"
    );
  }
  if (!process.env.CONTENTFUL_SPACE_ID) {
    throw new Error("CONTENTFUL_SPACE_ID must be set");
  }

  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken,
    host: isDraft ? "preview.contentful.com" : "cdn.contentful.com",
  });

  clientCache[cacheKey] = client;

  return client;
};
```

### Create Types

Create `lib/contentful/types.ts` for the `knowledgeArticle` content type:

```typescript
// lib/contentful/types.ts
import { EntriesQueries, EntryFieldTypes, EntrySkeletonType } from "contentful";

export enum CONTENT_TYPE_IDS {
  KNOWLEDGE_ARTICLE = "knowledgeArticle",
}

export type ArticleQuery = EntriesQueries<
  ArticleSkeleton,
  "WITHOUT_UNRESOLVABLE_LINKS"
>;

export interface ArticleSkeleton extends EntrySkeletonType {
  contentTypeId: CONTENT_TYPE_IDS.KNOWLEDGE_ARTICLE;
  fields: {
    title: EntryFieldTypes.Text;
    slug: EntryFieldTypes.Text;
    summary: EntryFieldTypes.Text;
    details: EntryFieldTypes.RichText;
    date: EntryFieldTypes.Date;
    authorName: EntryFieldTypes.Text;
    categoryName: EntryFieldTypes.Text;
    articleImage: EntryFieldTypes.AssetLink;
  };
}
```

### Create Utility Functions

Create `lib/contentful/utils.ts` for Contentful-specific utility functions:

```typescript
// lib/contentful/utils.ts
import { EntryCollection } from "contentful";
import { ArticleSkeleton } from "./types";

export const extractArticleFields = (
  entries: EntryCollection<ArticleSkeleton, "WITHOUT_UNRESOLVABLE_LINKS">
) => {
  return entries.items.map((entry) => entry.fields);
};
```

### Create Queries

Create `lib/contentful/queries.ts` for the Contentful API queries:

```typescript
// lib/contentful/queries.ts
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
```

The `"use cache"` directive at the top of the function tells Next.js to cache its return value. The `cacheTag()` call registers tags that identify this cached data - we tag it with `"articles"` and also the specific article IDs from the response. When content changes in Contentful, we can invalidate by these tags to refresh only the affected data.

### Create General Utilities

Create `lib/utils.ts` for general utility functions used across the app:

```typescript
// lib/utils.ts
export const getFormattedDate = (dateString: string): string | null => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string provided: ${dateString}`);
    return null;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
```

---

## Create Components

Create a `components` directory in the root of your project.

### Header Component

Create `components/header.tsx`:

```tsx
// components/header.tsx
import Link from "next/link";

export const Header = ({ title }: { title: string }) => {
  return (
    <header className="border-b border-black/5 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <span className="text-2xl font-semibold tracking-tight text-black">
          <Link href="/">{title}</Link>
        </span>
      </div>
    </header>
  );
};
```

### Contentful Image Component

Create `components/contentful-image.tsx` to render optimized images from Contentful:

```tsx
// components/contentful-image.tsx
"use client";

import Image, { ImageLoader, ImageLoaderProps, ImageProps } from "next/image";

const contentfulLoader: ImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps) => {
  return `${src}?w=${width}&q=${quality || 75}`;
};

type ContentfulImageProps = Omit<ImageProps, "src"> & {
  src?: string;
};

export function ContentfulImage({ ...props }: ContentfulImageProps) {
  if (!props.src) {
    return null;
  }
  return (
    <Image
      loader={contentfulLoader}
      {...props}
      alt={props.alt}
      src={props.src || "/placeholder.svg"}
    />
  );
}
```

---

## Build the Homepage

### Update the Root Layout

Since we want the app to show "Knowledge Articles" in a header on all pages, update `app/layout.tsx`:

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';
import "./globals.css";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Knowledge Articles",
  description: "Browse our knowledge base articles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <div className="min-h-screen bg-white">
          <Header title="Knowledge Articles" />
          {children}
        </div>
      </body>
    </html>
  );
}
```

### Create the Homepage

Replace the contents of `app/page.tsx` with the article listing:

```tsx
// app/page.tsx
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
          <div className="relative w-full aspect-[2/1] overflow-hidden bg-black/5">
            <div className="w-full h-full bg-gradient-to-r from-black/5 via-black/10 to-black/5 animate-pulse" />
          </div>

          <div className="p-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-6 w-24 bg-black/10 animate-pulse" />
              <div className="h-4 w-32 bg-black/5 animate-pulse" />
            </div>

            <div className="mb-4 space-y-2">
              <div className="h-9 w-full bg-black/10 animate-pulse" />
              <div className="h-9 w-3/4 bg-black/10 animate-pulse" />
            </div>

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
```

You should now be able to open the app at `http://localhost:3000` and see the example content articles you created.

---

## Add the Article Detail Page

Create a dynamic route for individual articles. In Next.js 16, route parameters are async, which lets the framework coordinate when values are resolved during streaming and caching.

Create the directory and file `app/articles/[slug]/page.tsx`:

```tsx
// app/articles/[slug]/page.tsx
import Link from "next/link";
import { notFound } from 'next/navigation';
import { getArticles } from "@/lib/contentful/queries";
import { getFormattedDate } from "@/lib/utils";
import { ContentfulImage } from "@/components/contentful-image";
import { draftMode } from "next/headers";
import { Suspense } from "react";

export async function generateStaticParams() {
  const allArticles = await getArticles();

  return allArticles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function KnowledgeArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Suspense fallback={<ArticleContentSkeleton />}>
        <ArticleContent params={props.params} />
      </Suspense>

      <Suspense fallback={<SuggestedArticleSkeleton />}>
        <SuggestedArticle params={props.params} />
      </Suspense>
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

async function ArticleContent(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const isDraft = (await draftMode()).isEnabled;
  const article = await getArticles(isDraft, {
    "fields.slug": params.slug,
    limit: 1,
  });

  if (!article || article.length === 0) {
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
  } = article[0];

  const formattedDate = getFormattedDate(date);
  return (
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
        <ContentfulImage
          src={articleImage?.fields?.file?.url}
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
        className="max-w-none"
        style={{
          color: "rgb(0 0 0 / 0.8)",
        }}
      >
        {/* Rich text will be rendered here - we'll add the Markdown component next */}
        {JSON.stringify(details)}
      </div>
    </article>
  );
}

async function SuggestedArticle(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const currentSlug = params.slug;
  const allArticles = await getArticles();
  const currentArticleIndex = allArticles.findIndex(
    (a) => a.slug === currentSlug
  );

  if (currentArticleIndex === -1 || allArticles.length < 2) {
    return null;
  }

  const suggestedArticle =
    allArticles[(currentArticleIndex + 1) % allArticles.length];

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
            <ContentfulImage
              src={articleImage?.fields?.file?.url}
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
```

Now if you click on an article, you should see the article detail page. However, you'll notice the content of the article is raw rich text JSON and not legible. We'll fix that next.

---

## Render Rich Text Content

We need to transform Contentful's rich text into React components. Create `lib/markdown.tsx`:

```tsx
// lib/markdown.tsx
import { ContentfulImage } from "@/components/contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, Document } from "@contentful/rich-text-types";

export function Markdown({ content }: { content: Document }) {
  return documentToReactComponents(content, {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node, children) => (
        <p className="mb-4">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (_node, children) => (
        <h1 className="text-3xl font-semibold mb-4">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (_node, children) => (
        <h2 className="text-2xl font-semibold mb-4">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (_node, children) => (
        <h3 className="text-xl font-semibold mb-4">{children}</h3>
      ),
      [BLOCKS.HEADING_4]: (_node, children) => (
        <h4 className="text-lg font-semibold mb-4">{children}</h4>
      ),
      [BLOCKS.HEADING_5]: (_node, children) => (
        <h5 className="text-base font-semibold mb-4">{children}</h5>
      ),
      [BLOCKS.HEADING_6]: (_node, children) => (
        <h6 className="text-sm font-semibold mb-4">{children}</h6>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => (
        <ContentfulImage
          src={node.data.target.url}
          alt={node.data.target.description}
          width={node.data.target.details.image.width}
          height={node.data.target.details.image.height}
        />
      ),
    },
  });
}
```

Now update the article detail page to use the `Markdown` component. In `app/articles/[slug]/page.tsx`, add the import and replace the `JSON.stringify(details)` line:

```tsx
// At the top of app/articles/[slug]/page.tsx, add the import:
import { Markdown } from "@/lib/markdown";

// Then in the ArticleContent component, replace:
// {JSON.stringify(details)}
// with:
<Markdown content={details} />
```

You should now see the rich text rendered as proper HTML elements.

---

## Enable Cache Components

Cache Components let you opt a server component into a cache with the `"use cache"` directive. You can set how long the cache should live and attach tags that describe what content it depends on.

### Configure Next.js

Update `next.config.ts` (or create it if it doesn't exist):

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
```

When `cacheComponents` is enabled, all routes are treated as dynamic by default. The `"use cache"` directive tells Next.js to cache the function's return value and reuse it across requests.

### Understanding Cache Tags

One of the major benefits of Next.js 16 is that we can define cache tags **after** we fetch content. We tag the cache with the actual article IDs from the response:

```typescript
// This will be added later in the code
```

This way, when any article in the result set changes, the cache invalidates automatically.

> **Note:** For the complete explanation and best practices around `Suspense` and `"use cache"`, refer to the [official Next.js documentation](https://nextjs.org/docs/app/building-your-application/caching).

---

## Set Up On-Demand Revalidation

Next.js makes it simple to revalidate when content changes. You attach tags to cached components and call an API route from Contentful when an entry publishes.

### Create the Revalidate Secret

Add a secret to your `.env.local` file. This can be a random, secure string. You can create one using:

```bash
openssl rand -base64 32
```

Add it to your `.env.local`:

```bash
CONTENTFUL_REVALIDATE_SECRET=your-generated-secret
```

### Create the Revalidate API Route

Create `app/api/revalidate/route.ts`:

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    console.error("Invalid CONTENTFUL_REVALIDATE_SECRET");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sys } = body;
  const { id } = sys;

  if (!id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(id, "max");
  console.log(`Revalidated entity: ${id}`);

  return NextResponse.json({ success: true }, { status: 200 });
}
```

### Configure the Contentful Webhook

After deploying your app to Vercel (covered in the deployment section), configure Contentful to call the revalidate API:

1. Log into your Contentful space and go to **Settings > Webhooks**
2. Click **"Add Webhook"**
3. Configure the following:
   - **Name:** Next.js Revalidation
   - **URL:** `https://your-domain.vercel.app/api/revalidate`
   - **Triggers:** Select "Publish" and "Unpublish" for Entry events
   - **Headers:** Add a custom header with key `x-vercel-reval-key` and value matching your `CONTENTFUL_REVALIDATE_SECRET`
4. Click **"Save"**

---

## Set Up Draft Mode

Draft Mode lets editors preview unpublished content before it goes live. This requires two API routes and a preview secret.

### Add the Preview Secret

Add another secret to your `.env.local`:

```bash
CONTENTFUL_PREVIEW_SECRET=your-preview-secret
```

### Create the Draft Mode Route

Create `app/api/draft/route.ts`:

```typescript
// app/api/draft/route.ts
import { draftMode } from "next/headers";
import { redirect } from 'next/navigation';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const redirectTo = searchParams.get("redirectTo");

  if (!secret) {
    console.error("Missing Draft Mode secret parameter");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    console.error("Invalid CONTENTFUL_PREVIEW_SECRET");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  (await draftMode()).enable();
  redirect(redirectTo || "/");
}
```

### Create the Disable Draft Route

Create `app/api/disable-draft/route.ts`:

```typescript
// app/api/disable-draft/route.ts
import { draftMode } from "next/headers";

export async function GET() {
  (await draftMode()).disable();
  return new Response("Draft mode is disabled");
}
```

### Using Draft Mode

- **Enable draft mode:** Visit `/api/draft?secret=YOUR_PREVIEW_SECRET&redirectTo=/`
- **Disable draft mode:** Visit `/api/disable-draft`

When draft mode is enabled, the app uses Contentful's Preview API to fetch unpublished content.

---

## Deploy to Vercel

### Step 1: Push to a Git Repository

If you haven't already, create a new git repository and push your code:

```bash
git add .
git commit -m 'Integrated Next.js 16 with Contentful'
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push origin main
```

### Step 2: Import to Vercel

1. Sign up or log in to your [Vercel account](https://vercel.com)
2. Click **"Add New Project"** and import your repository
3. Vercel will automatically detect Next.js and configure the build settings

### Step 3: Add Environment Variables

In your Vercel project settings, add the following environment variables:

| Variable Name                   | Value                           |
| ------------------------------- | ------------------------------- |
| CONTENTFUL_SPACE_ID             | Your Contentful space ID        |
| CONTENTFUL_ACCESS_TOKEN         | Your Content Delivery API token |
| CONTENTFUL_PREVIEW_ACCESS_TOKEN | Your Content Preview API token  |
| CONTENTFUL_PREVIEW_SECRET       | Your preview secret             |
| CONTENTFUL_REVALIDATE_SECRET    | Your revalidation secret        |

### Step 4: Deploy

Click **"Deploy"** and Vercel will build and deploy your application. Once complete, configure the Contentful webhook to use your production URL.

---

## Summary

Congratulations! You've built a content-driven Next.js 16 application with:

- A Contentful space with a Knowledge Article content model
- API tokens connected to your Next.js app
- A layout, homepage listing articles, and detail page showing full content
- Optimized image handling with the Contentful Image component
- Cache Components for fast, cached content delivery
- Tagged cache entries with on-demand revalidation
- Suspense boundaries with skeleton loaders for smooth UX
- Draft mode for previewing unpublished content
- Deployment to Vercel for fast, scalable hosting

Your app now delivers static-level performance with the flexibility of dynamic content. Editors can publish content in Contentful and see updates appear instantly across your site.

---

## Troubleshooting

### "CONTENTFUL_ACCESS_TOKEN must be set" Error

Ensure your `.env.local` file exists in the project root with all required environment variables. Restart your development server after adding or changing environment variables.

### Images Not Loading

1. Verify `images.ctfassets.net` is in your `next.config.ts` remote patterns
2. Ensure your Contentful images are published, not just saved as drafts
3. Check that the image URLs start with `https://`

### Revalidation Not Working

1. Verify the webhook URL is correct: `https://your-domain.vercel.app/api/revalidate`
2. Ensure the `x-vercel-reval-key` header matches your `CONTENTFUL_REVALIDATE_SECRET`
3. Check Vercel deployment logs for errors

### Draft Mode Not Enabling

Ensure your `CONTENTFUL_PREVIEW_SECRET` in `.env.local` matches the secret in your URL query parameter exactly.

### Cache Not Updating

1. Verify `cacheComponents: true` is set in `next.config.ts`
2. Check that the `"use cache"` directive is at the top of your data fetching function
3. Ensure cache tags are being set after data is fetched

---

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Next.js Cache Components](https://nextjs.org/docs/app/building-your-application/caching)
- [Contentful Documentation](https://www.contentful.com/developers/docs/)
- [Vercel Documentation](https://vercel.com/docs)

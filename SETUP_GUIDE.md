# Integrate Contentful with Next.js 16 Cache Components

Next.js 16 introduced many new features including Cache Components, React Compiler support, and faster development and production builds with Turbopack. These updates give teams building content sites more control over how pages render and refresh content while maintaining high performance. Read the [full Next.js 16 announcement](https://nextjs.org/blog/next-16) for more details.

Among these improvements, **Cache Components** are especially valuable for content-driven applications. They let you choose which components are cached, set how long the cache should live, and attach tags that map to the content they depend on. This enables you to define caching strategies and tags per component rather than for an entire page, giving precise control over when and what updates. It allows content to be rendered extremely fast while still updating the moment an editor clicks "Publish."

This guide walks through creating a Next.js application that uses Contentful to manage and deliver knowledge base articles. You will build a listing page and an article detail view using Cache Components, and set up on-demand revalidation so updates appear as soon as content is published. You'll also add draft preview support and deploy the finished site to Vercel.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Setting Up Contentful](#setting-up-contentful)
4. [Configuring Environment Variables](#configuring-environment-variables)
5. [Understanding the Project Structure](#understanding-the-project-structure)
6. [How Cache Components Work](#how-cache-components-work)
7. [Setting Up Revalidation](#setting-up-revalidation)
8. [Setting Up Draft Mode](#setting-up-draft-mode)
9. [Deploying to Vercel](#deploying-to-vercel)
10. [Summary](#summary)

---

## Prerequisites

Before getting started, ensure you have the following:

- **Node.js 18.17 or later** - [Download here](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **A Contentful account** - [Sign up here](https://www.contentful.com/sign-up/) (free tier available)
- **A Vercel account** - [Sign up here](https://vercel.com/signup) (for deployment)
- **Basic knowledge of JavaScript and React** - Familiarity with components, props, and async/await

> **New to React?** We recommend completing the [React Quick Start](https://react.dev/learn) guide before proceeding.

---

## Getting Started

You have two options to get started:

### Option 1: Clone the Starter Repository (Recommended)

This repository contains a fully working Next.js 16 + Contentful integration. Clone it and connect your own Contentful space:

```bash
git clone https://github.com/vercel-partner-solutions/nextjs-16-contentful-starter.git
cd nextjs-16-contentful-starter
npm install
```

### Option 2: Start from Scratch

If you prefer to build from scratch, create a new Next.js application:

```bash
npx create-next-app@latest my-contentful-app --yes
cd my-contentful-app
```

Then install the Contentful dependencies:

```bash
npm install contentful @contentful/rich-text-react-renderer
```

> **Note:** The `@contentful/rich-text-react-renderer` package automatically includes the necessary rich text types.

---

## Setting Up Contentful

### Step 1: Create a Contentful Space

1. Log in to your [Contentful dashboard](https://app.contentful.com/)
2. Click **"Add space"** and select **"Empty space"**
3. Give your space a name (e.g., "Knowledge Base")

> **Important:** You need admin access to your Contentful space to complete the following steps.

### Step 2: Create the Content Model

Navigate to **Content model** in the sidebar and click **"Add content type"**. Create a content type named `knowledgeArticle` (this exact ID is important) with the following fields:

| Field Name    | Field Type     | Required |
| ------------- | -------------- | -------- |
| title         | Short text     | Yes      |
| slug          | Short text     | Yes      |
| summary       | Short text     | Yes      |
| details       | Rich text      | Yes      |
| date          | Date and time  | Yes      |
| articleImage  | Media          | Yes      |
| authorName    | Short text     | Yes      |
| categoryName  | Short text     | Yes      |

Click **"Save"** when finished.

### Step 3: Create Sample Content

1. Navigate to the **Content** tab in the sidebar
2. Click **"Add entry"** and select **"knowledgeArticle"**
3. Fill in all fields with sample content
4. Click **"Publish"** to make the content available

Create at least **two articles** so you can see the article listing and suggestions working properly.

### Step 4: Generate API Keys

1. Go to **Settings** > **API keys** in your Contentful dashboard
2. Click **"Add API key"**
3. Give it a name (e.g., "Next.js Integration")
4. Save the following values - you'll need them in the next step:
   - **Space ID**
   - **Content Delivery API - access token**
   - **Content Preview API - access token**

> **Learn more:** See Contentful's [API key documentation](https://www.contentful.com/developers/docs/references/authentication/) for details.

---

## Configuring Environment Variables

Create a `.env.local` file in your project root with your Contentful credentials:

```bash
# Contentful API Configuration
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_content_delivery_access_token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_content_preview_access_token

# Security Secrets (generate your own random strings)
CONTENTFUL_PREVIEW_SECRET=your_preview_secret
CONTENTFUL_REVALIDATE_SECRET=your_revalidate_secret
```

### Generating Secure Secrets

For the `CONTENTFUL_PREVIEW_SECRET` and `CONTENTFUL_REVALIDATE_SECRET`, generate secure random strings. You can use this command:

```bash
openssl rand -base64 32
```

Or use any password generator to create a secure string (minimum 32 characters recommended).

> **Security Note:** Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

---

## Understanding the Project Structure

Here's how the project is organized:

```
├── app/
│   ├── api/
│   │   ├── draft/route.ts        # Enables draft mode for previewing unpublished content
│   │   ├── disable-draft/route.ts # Disables draft mode
│   │   └── revalidate/route.ts   # Webhook endpoint for Contentful to trigger cache refresh
│   ├── articles/
│   │   └── [slug]/page.tsx       # Dynamic article detail page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with header
│   └── page.tsx                  # Homepage with article listing
├── components/
│   ├── contentful-image.tsx      # Optimized image component for Contentful assets
│   └── header.tsx                # Site header
├── lib/
│   ├── contentful/
│   │   ├── client.ts             # Contentful SDK client configuration
│   │   ├── queries.ts            # Data fetching functions with caching
│   │   ├── types.ts              # TypeScript types for content
│   │   └── utils.ts              # Utility functions for Contentful data
│   ├── markdown.tsx              # Rich text renderer component
│   └── utils.ts                  # General utility functions
└── next.config.ts                # Next.js configuration with Cache Components enabled
```

### Key Files Explained

#### `next.config.ts` - Next.js Configuration

```typescript
import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,    // Enables React Compiler for automatic optimizations
  cacheComponents: true,  // Enables the "use cache" directive
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",  // Contentful's image CDN
        port: "",
        pathname: "/**",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
```

#### `lib/contentful/client.ts` - Contentful SDK Setup

This file creates a singleton Contentful client that can switch between the published (live) and preview (draft) APIs:

```typescript
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

  // ... validation and client creation
  
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken,
    host: isDraft ? "preview.contentful.com" : "cdn.contentful.com",
  });

  clientCache[cacheKey] = client;
  return client;
};
```

---

## How Cache Components Work

Cache Components are a new Next.js 16 feature that lets you cache the output of server components. Instead of caching entire pages, you can cache individual components with the `"use cache"` directive.

### The `"use cache"` Directive

In `lib/contentful/queries.ts`, the data fetching function uses the cache directive:

```typescript
import { cacheTag } from "next/cache";

export const getArticles = async (isDraft?: boolean, query?: ArticleQuery) => {
  "use cache";  // This tells Next.js to cache this function's output
  
  const client = getContentfulClient(isDraft);
  const entriesResult = await client.withoutUnresolvableLinks.getEntries<ArticleSkeleton>({
    content_type: CONTENT_TYPE_IDS.KNOWLEDGE_ARTICLE,
    ...query,
  });
  const entries = extractArticleFields(entriesResult);

  // Tag the cache with specific content IDs for targeted revalidation
  cacheTag(
    "articles",
    entriesResult?.items?.map((entry) => entry.sys?.id).join(",")
  );
  
  return entries;
};
```

### Key Benefits

1. **Granular caching** - Cache specific functions or components, not entire pages
2. **Dynamic tags** - Tag cache entries after fetching data, based on what was actually returned
3. **Targeted revalidation** - When content changes, only invalidate the specific cached entries affected

### Suspense Boundaries

The pages use React Suspense to show loading states while cached content loads:

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Suspense fallback={<ArticlesSkeleton />}>
        <Articles />
      </Suspense>
    </main>
  );
}
```

This provides a smooth user experience with skeleton loading states while data is being fetched.

---

## Setting Up Revalidation

When content changes in Contentful, you want your site to update automatically. This is done through a webhook that triggers cache revalidation.

### The Revalidation Endpoint

The `app/api/revalidate/route.ts` file handles incoming webhooks from Contentful:

```typescript
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify the request is from Contentful using the secret
  const secret = request.headers.get("x-vercel-reval-key");
  
  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sys } = body;
  const { id } = sys;

  if (!id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Revalidate the specific entry that changed
  // The "max" profile enables stale-while-revalidate behavior
  revalidateTag(id, "max");
  console.log(`Revalidated entity: ${id}`);

  return NextResponse.json({ success: true }, { status: 200 });
}
```

### Configure Contentful Webhook

After deploying your site to Vercel (see [Deploying to Vercel](#deploying-to-vercel)), set up the webhook:

1. In your Contentful space, go to **Settings** > **Webhooks**
2. Click **"Add Webhook"**
3. Configure the webhook:
   - **Name:** "Next.js Revalidation"
   - **URL:** `https://your-domain.vercel.app/api/revalidate`
   - **Triggers:** Select "Publish" and "Unpublish" for Entry events
   - **Headers:** Add a custom header:
     - **Key:** `x-vercel-reval-key`
     - **Value:** Your `CONTENTFUL_REVALIDATE_SECRET`
4. Click **"Save"**

Now whenever you publish or unpublish content in Contentful, your Next.js site will automatically revalidate the affected cached content.

---

## Setting Up Draft Mode

Draft Mode lets editors preview unpublished content before it goes live.

### How It Works

1. **Enable Draft Mode:** Visit `/api/draft?secret=YOUR_PREVIEW_SECRET&redirectTo=/`
2. **Preview Content:** The site now fetches from Contentful's Preview API, showing unpublished changes
3. **Disable Draft Mode:** Visit `/api/disable-draft` to return to normal viewing

### Draft Mode Routes

**Enable draft mode** (`app/api/draft/route.ts`):

```typescript
import { draftMode } from "next/headers";
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const redirectTo = searchParams.get("redirectTo");

  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  (await draftMode()).enable();
  redirect(redirectTo || "/");
}
```

**Disable draft mode** (`app/api/disable-draft/route.ts`):

```typescript
import { draftMode } from "next/headers";

export async function GET() {
  (await draftMode()).disable();
  return new Response("Draft mode is disabled");
}
```

### Using Draft Mode in Components

Pages check for draft mode and pass it to the data fetching function:

```typescript
async function Articles() {
  const { isEnabled } = await draftMode();
  const articles = await getArticles(isEnabled);  // Uses Preview API if draft mode is enabled
  // ...
}
```

---

## Deploying to Vercel

### Step 1: Push to Git Repository

If you haven't already, push your code to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git add .
git commit -m "Initial commit: Next.js 16 + Contentful integration"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import"** next to your repository
3. Vercel will automatically detect Next.js and configure build settings

### Step 3: Configure Environment Variables

Before deploying, add your environment variables:

1. In the Vercel project settings, go to **Settings** > **Environment Variables**
2. Add the following variables:

| Name                            | Value                              |
| ------------------------------- | ---------------------------------- |
| CONTENTFUL_SPACE_ID             | Your Contentful space ID           |
| CONTENTFUL_ACCESS_TOKEN         | Your Content Delivery API token    |
| CONTENTFUL_PREVIEW_ACCESS_TOKEN | Your Content Preview API token     |
| CONTENTFUL_PREVIEW_SECRET       | Your generated preview secret      |
| CONTENTFUL_REVALIDATE_SECRET    | Your generated revalidation secret |

### Step 4: Deploy

Click **"Deploy"** and Vercel will build and deploy your application. Once complete, you'll receive a URL where your site is live.

### Step 5: Configure Contentful Webhook

Now that your site is deployed, go back to Contentful and set up the revalidation webhook using your production URL (see [Setting Up Revalidation](#setting-up-revalidation)).

---

## Summary

Congratulations! You've built a content-driven Next.js application with:

- **Cache Components** - Server-side caching with the `"use cache"` directive for fast page loads
- **Dynamic cache tags** - Tag cached content with specific entry IDs for targeted revalidation
- **On-demand revalidation** - Automatic cache refresh when content is published in Contentful
- **Draft preview** - Preview unpublished content before it goes live
- **Optimized images** - Contentful images served through Next.js Image optimization
- **Loading states** - Suspense boundaries with skeleton loaders for smooth UX

### What You Learned

1. How to set up a Contentful space with a content model
2. How to configure the Contentful SDK with environment variables
3. How Cache Components work in Next.js 16
4. How to implement on-demand revalidation with webhooks
5. How to set up draft mode for content previews
6. How to deploy to Vercel with proper environment configuration

### Next Steps

- Add more content types to your Contentful space
- Customize the styling with Tailwind CSS
- Add search functionality
- Implement pagination for large article collections
- Set up content previews directly from the Contentful editor

---

## Troubleshooting

### "CONTENTFUL_ACCESS_TOKEN must be set" Error

Make sure your `.env.local` file exists in the project root and contains all required environment variables. Restart your development server after adding environment variables.

### Images Not Loading

Verify that:
1. Your `next.config.ts` includes `images.ctfassets.net` in the `remotePatterns`
2. Your Contentful images are published (not just saved as drafts)

### Revalidation Not Working

1. Check that your webhook URL is correct in Contentful settings
2. Verify the `x-vercel-reval-key` header matches your `CONTENTFUL_REVALIDATE_SECRET`
3. Check your Vercel deployment logs for any errors

### Draft Mode Not Enabling

Ensure your `CONTENTFUL_PREVIEW_SECRET` in `.env.local` matches the secret you're passing in the URL query parameter.

---

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Contentful Documentation](https://www.contentful.com/developers/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Cache Components](https://nextjs.org/docs/app/building-your-application/caching)

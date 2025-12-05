import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    console.error("Invalid CONTENTFUL_REVALIDATE_SECRET");
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("articles", "max");
  console.log(`Revalidated articles`);

  return NextResponse.json({ success: true }, { status: 200 });
}

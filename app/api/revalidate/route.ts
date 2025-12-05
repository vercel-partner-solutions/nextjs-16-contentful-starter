import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    console.error("Invalid CONTENTFUL_REVALIDATE_SECRET secret");
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const body = await request.json();

  const { entityId } = body;

  revalidateTag(entityId, "max");

  console.log(`Revalidated entity: ${entityId}`);
  return NextResponse.json({ revalidated: true, entityId, now: Date.now() });
}

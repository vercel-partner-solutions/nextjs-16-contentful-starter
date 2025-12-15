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

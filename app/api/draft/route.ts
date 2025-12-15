import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
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

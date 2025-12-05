import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const redirectTo = searchParams.get("redirectTo");

  if (!secret) {
    console.error("Missing Draft Mode secret parameter");
    notFound();
  }

  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
    console.error("Invalid CONTENTFUL_PREVIEW_SECRET");
    notFound();
  }

  (await draftMode()).enable();
  redirect(redirectTo || "/");
}

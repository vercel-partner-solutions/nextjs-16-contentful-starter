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

  // Validate redirectTo to prevent open redirect vulnerability
  // Only allow relative paths that start with /
  let safeRedirectTo = "/";
  if (redirectTo) {
    try {
      // Check if it's a relative path starting with /
      if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        // Parse to ensure it doesn't contain protocol or domain
        const url = new URL(redirectTo, "http://localhost");
        if (url.protocol === "http:" && url.hostname === "localhost") {
          safeRedirectTo = redirectTo;
        }
      }
    } catch {
      // Invalid URL, use default
      console.error("Invalid redirectTo parameter");
    }
  }

  (await draftMode()).enable();
  redirect(safeRedirectTo);
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/api/auth"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|ico|webp|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const password = process.env.DASHBOARD_PASSWORD;

  // Fail closed: no password configured = block everything
  if (!password) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cookie = request.cookies.get("donkey-auth")?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Verify HMAC-signed cookie
  const expected = await computeHmac(password);
  if (cookie !== expected) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

async function computeHmac(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("donkey-cave-session"),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

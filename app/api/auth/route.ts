import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_COOKIE = "donkey-auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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

export async function POST(req: Request) {
  const password = process.env.DASHBOARD_PASSWORD;

  // Fail closed: no password configured = reject
  if (!password) {
    return NextResponse.json(
      { ok: false, message: "Auth not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const submitted = body.password ?? "";

  if (submitted !== password) {
    return NextResponse.json(
      { ok: false, message: "Wrong password" },
      { status: 401 },
    );
  }

  // Set HMAC-signed cookie (unforgeable without knowing the password)
  const hmac = await computeHmac(password);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, hmac, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const password = process.env.DASHBOARD_PASSWORD;

  // Fail closed: no password = auth required but can't satisfy it
  if (!password) {
    return NextResponse.json({ authed: false, required: true });
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE)?.value;

  if (!cookie) {
    return NextResponse.json({ authed: false, required: true });
  }

  const expected = await computeHmac(password);
  const authed = cookie === expected;

  return NextResponse.json({ authed, required: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}

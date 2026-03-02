import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_COOKIE = "donkey-auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  const password = process.env.DASHBOARD_PASSWORD;

  // If no password configured, auth is disabled
  if (!password) {
    return NextResponse.json({ ok: true, message: "Auth disabled" });
  }

  const body = await req.json().catch(() => ({}));
  const submitted = body.password ?? "";

  if (submitted !== password) {
    return NextResponse.json(
      { ok: false, message: "Wrong password" },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "1", {
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
  if (!password) {
    return NextResponse.json({ authed: true, required: false });
  }

  const cookieStore = await cookies();
  const authed = cookieStore.get(AUTH_COOKIE)?.value === "1";
  return NextResponse.json({ authed, required: true });
}

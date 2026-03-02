import { NextResponse } from "next/server";

const CLOB_BASE = "https://clob.polymarket.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("token_id");
  const interval = searchParams.get("interval") ?? "1d";
  const fidelity = searchParams.get("fidelity") ?? "60";

  if (!tokenId) {
    return NextResponse.json({ error: "token_id required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      market: tokenId,
      interval,
      fidelity,
    });

    const resp = await fetch(`${CLOB_BASE}/prices-history?${params}`, {
      headers: { "User-Agent": "DonkeyCave/1.0" },
      next: { revalidate: 60 },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `CLOB returned ${resp.status}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

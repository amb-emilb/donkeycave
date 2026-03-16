const VPS_URL = "http://81.27.109.191:3100";
const PROXY_SECRET =
  "7b6ce57a8093020a88ea6184fd2fe87c54ebc65f115d02dcd6f9a938e3f15f3b";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const upstream = await fetch(
    `${VPS_URL}/logs?token=${PROXY_SECRET}`,
    {
      headers: { Accept: "text/event-stream" },
      // @ts-expect-error -- Node fetch supports duplex streaming
      duplex: "half",
    }
  );

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

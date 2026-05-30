import type { NextRequest } from "next/server";

export async function POST(_req: NextRequest): Promise<Response> {
  return new Response(JSON.stringify({ error: "not implemented" }), {
    status: 501,
    headers: { "content-type": "application/json" },
  });
}

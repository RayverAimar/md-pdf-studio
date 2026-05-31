import type { RenderInput, Theme } from "@md-pdf-studio/core";
import type { NextRequest } from "next/server";
import { PuppeteerRenderPort } from "./puppeteerRenderPort";

// Puppeteer and pdf.js need the Node runtime; the two-pass render can outlast the default budget.
export const runtime = "nodejs";
export const maxDuration = 60;

const port = new PuppeteerRenderPort();

function isRenderInput(value: unknown): value is RenderInput {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { markdown?: unknown; theme?: unknown; options?: unknown };
  const theme = candidate.theme as Partial<Theme> | undefined;
  // `options` is optional and self-validating: an absent or malformed locale defaults downstream.
  if (candidate.options !== undefined && typeof candidate.options !== "object") return false;
  return (
    typeof candidate.markdown === "string" &&
    typeof theme === "object" &&
    theme !== null &&
    typeof theme.values === "object"
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!isRenderInput(body)) {
    return new Response("Expected { markdown: string, theme: Theme }", { status: 400 });
  }

  // Out-of-range or malformed values are clamped or defaulted inside generateCss, so a render either
  // succeeds or fails on infrastructure, never on user style input.
  const result = await port.render(body);
  if (!result.ok) return new Response(result.error.message, { status: 500 });

  return new Response(result.pdf as BodyInit, {
    status: 200,
    headers: { "content-type": "application/pdf", "cache-control": "no-store" },
  });
}

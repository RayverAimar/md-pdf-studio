import type { RenderInput, RenderPort, RenderResult } from "@md-pdf-studio/core";
import { type RenderHtmlToPdf, renderDocumentWithToc } from "@md-pdf-studio/render";
import puppeteer, { type Browser, type Page } from "puppeteer";

const PRINT_OPTIONS = {
  printBackground: true,
  preferCSSPageSize: true,
} as const;

// pdf.js (used by the shared page reader) expects these DOM globals to exist. Node has none; we only
// read named destinations, never rasterize, so empty shims that accept any constructor args suffice.
function ensurePdfGlobals(): void {
  const globals = globalThis as Record<string, unknown>;
  const noop = class {
    // biome-ignore lint/complexity/noUselessConstructor: an explicit any-args ctor is the shim's whole point.
    constructor(..._args: unknown[]) {}
  };
  for (const name of ["DOMMatrix", "ImageData", "Path2D"]) globals[name] ??= noop;
}

// One headless Chromium serves every request; launching per render would dominate latency.
let browserPromise: Promise<Browser> | null = null;
function sharedBrowser(): Promise<Browser> {
  browserPromise ??= puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browserPromise;
}

function printerFor(page: Page): RenderHtmlToPdf {
  return async (html, meta) => {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // When a template reserves margin, the port's margin must win over @page so the body never
    // overlaps the band; preferCSSPageSize still governs the page size itself.
    const pdf = await page.pdf({
      ...PRINT_OPTIONS,
      displayHeaderFooter: meta.displayHeaderFooter,
      headerTemplate: meta.headerTemplate,
      footerTemplate: meta.footerTemplate,
      margin: {
        top: `${meta.marginTopMm}mm`,
        right: `${meta.marginRightMm}mm`,
        bottom: `${meta.marginBottomMm}mm`,
        left: `${meta.marginLeftMm}mm`,
      },
    });
    return new Uint8Array(pdf);
  };
}

/** RenderPort backed by Puppeteer's Chromium. The two-pass TOC logic is shared, not duplicated. */
export class PuppeteerRenderPort implements RenderPort {
  async render(input: RenderInput): Promise<RenderResult> {
    ensurePdfGlobals();
    const page = await (await sharedBrowser()).newPage();
    try {
      const pdf = await renderDocumentWithToc(input, { renderHtmlToPdf: printerFor(page) });
      return { ok: true, pdf };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { kind: "unknown", message } };
    } finally {
      await page.close();
    }
  }
}

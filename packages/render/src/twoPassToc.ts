import { DEFAULT_LOCALE, type RenderInput } from "@md-pdf-studio/core";
import {
  buildDocument,
  buildTocHtml,
  type HeadingPages,
  prepareContent,
  resolveTocOptions,
} from "./document";
import { buildPrintMeta, type PrintMeta } from "./headerFooter";
import { readHeadingPages } from "./readPages";

/** Renders a complete HTML document to PDF bytes — the only piece each platform shell implements. */
export type RenderHtmlToPdf = (html: string, meta: PrintMeta) => Promise<Uint8Array>;

/** Resolves heading id → page from PDF bytes; injectable so the orchestration can be tested with fakes. */
export type ReadHeadingPages = (pdf: Uint8Array, headingIds: string[]) => Promise<HeadingPages>;

export interface TwoPassDependencies {
  renderHtmlToPdf: RenderHtmlToPdf;
  readHeadingPages?: ReadHeadingPages;
}

export interface TwoPassOptions {
  /** Cap on render passes. Page numbers converge in one or two extra passes in practice. */
  maxPasses?: number;
}

const DEFAULT_MAX_PASSES = 4;

function pagesAreEqual(a: HeadingPages, b: HeadingPages): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key] === b[key]);
}

/**
 * Render Markdown to a PDF whose table of contents shows real page numbers. Chromium has no
 * single-pass page counter, so we render, read where each heading landed, rebuild the TOC and
 * re-render until the page mapping stops changing — inserting the TOC can itself shift later pages.
 */
export async function renderDocumentWithToc(
  input: RenderInput,
  deps: TwoPassDependencies,
  options: TwoPassOptions = {},
): Promise<Uint8Array> {
  const readPages = deps.readHeadingPages ?? readHeadingPages;
  const maxPasses = options.maxPasses ?? DEFAULT_MAX_PASSES;
  const { contentHtml, headings } = prepareContent(input.markdown);
  const headingIds = headings.map((heading) => heading.id);

  const locale = input.options?.locale ?? DEFAULT_LOCALE;
  const tocOptions = resolveTocOptions(input.theme, locale);
  const tocEnabled = tocOptions.enabled;
  const meta = buildPrintMeta(input.theme, locale);

  let pages: HeadingPages = {};
  let pdf: Uint8Array = new Uint8Array();

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const tocHtml = buildTocHtml(headings, pages, tocOptions);
    pdf = await deps.renderHtmlToPdf(buildDocument(input.theme, tocHtml + contentHtml), meta);

    // Reading pages back only matters for the TOC; with it disabled a single pass is exact.
    if (!tocEnabled || headingIds.length === 0) break;

    const nextPages = await readPages(pdf, headingIds);
    if (pagesAreEqual(pages, nextPages)) break;
    pages = nextPages;
  }

  return pdf;
}

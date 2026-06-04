import type { Locale, Theme } from "@md-pdf-studio/core";
// Subpath imports keep pdf.js (pulled by the render barrel via readPages) out of the client bundle;
// every module referenced here is DOM- and pdf.js-free.
import { buildTocHtml, type Heading, resolveTocOptions } from "@md-pdf-studio/render/document";
import { buildPrintMeta } from "@md-pdf-studio/render/headerFooter";
import { type PageGeometry, pageGeometry } from "@md-pdf-studio/render/pageGeometry";

// The PDF's band markup uses Chromium print tokens that only resolve inside the print context. In the
// preview the sheet is page one, so the current page is honestly "1"; the total is unknowable from a
// single continuous flow, so an em-dash signals "unresolved" rather than faking a count.
const PREVIEW_PAGE_NUMBER = "1";
const PREVIEW_TOTAL_PAGES = "—";
const PAGE_NUMBER_TOKEN = '<span class="pageNumber"></span>';
const TOTAL_PAGES_TOKEN = '<span class="totalPages"></span>';

/** A header/footer band ready to drop into the preview's reserved strip, or null when inactive. */
export interface PreviewBand {
  html: string;
  reserveMm: number;
}

export interface PreviewBands {
  header: PreviewBand | null;
  footer: PreviewBand | null;
}

/**
 * The simulated sheet geometry for the preview frame. Delegates to the render layer's pageGeometry so
 * the preview's effective margins (incl. the header/footer reserve) are the exact ones the PDF uses;
 * extracted as a one-liner so it is unit-testable without a DOM and asserted against pageGeometry.
 */
export function previewGeometry(theme: Theme, locale: Locale): PageGeometry {
  return pageGeometry(theme, locale);
}

// The print template bundles an @font-face for the isolated print context; the preview iframe already
// has Inter, so the duplicate face is dropped — it would only re-declare a font the document has.
function stripInlineFontFace(template: string): string {
  return template.replace(/<style>[\s\S]*?<\/style>/g, "");
}

// Chromium fills these tokens at print time; the preview substitutes its honest single-sheet values.
function fillPrintTokens(template: string): string {
  return template
    .replaceAll(PAGE_NUMBER_TOKEN, `<span class="pageNumber">${PREVIEW_PAGE_NUMBER}</span>`)
    .replaceAll(TOTAL_PAGES_TOKEN, `<span class="totalPages">${PREVIEW_TOTAL_PAGES}</span>`);
}

/**
 * Build the header/footer bands as chrome that mirrors the PDF exactly: the markup comes verbatim from
 * buildPrintMeta (same inline styles, font size, color, content, localized page word), so the band can
 * never re-implement the PDF's layout. Only the print-only @font-face and live page tokens are adapted
 * for the preview context. Bands live in the frame chrome, never in the document stylesheet.
 */
export function previewBands(theme: Theme, locale: Locale): PreviewBands {
  const geom = pageGeometry(theme, locale);
  const meta = buildPrintMeta(theme, locale);
  return {
    header: geom.headerActive
      ? {
          html: fillPrintTokens(stripInlineFontFace(meta.headerTemplate)),
          reserveMm: geom.reserve.topMm,
        }
      : null,
    footer: geom.footerActive
      ? {
          html: fillPrintTokens(stripInlineFontFace(meta.footerTemplate)),
          reserveMm: geom.reserve.bottomMm,
        }
      : null,
  };
}

/**
 * Build the preview's leading TOC nav. It reuses buildTocHtml with an EMPTY page map and the same TOC
 * options the PDF engine resolves, so entries, depth, indent and localized title match. Page numbers
 * stay blank: resolving them needs the 2-pass PDF render (pdf.js named destinations), which the live
 * preview does not run. This nav is real document content styled by composeDocumentCss's .mdp-toc-*
 * rules, exactly like the PDF, so it is WYSIWYG-correct for everything except the unresolved number.
 */
export function previewTocHtml(theme: Theme, headings: Heading[], locale: Locale): string {
  return buildTocHtml(headings, {}, resolveTocOptions(theme, locale));
}

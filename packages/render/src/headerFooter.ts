import {
  DEFAULT_LOCALE,
  FONT_FACE_CSS,
  FontStack,
  isHexColor,
  type Locale,
  message,
  schema,
  type Theme,
} from "@md-pdf-studio/core";
import { pageGeometry } from "./pageGeometry";
import { num, str } from "./themeValue";

/** Print primitives derived from the header/footer + page controls, mapped to each shell's API. */
export interface PrintMeta {
  displayHeaderFooter: boolean;
  /** Inline-styled HTML; Chromium renders templates at font-size:0, so every span styles itself. */
  headerTemplate: string;
  footerTemplate: string;
  /** Page margins in millimetres, widened on the edges that carry a template. */
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

const HeaderContent = {
  none: "none",
  title: "title",
  date: "date",
  titleDate: "title-date",
} as const;

const FooterContent = {
  none: "none",
  page: "page",
  pageTotal: "page-total",
  titlePage: "title-page",
} as const;

// The template runs in an isolated Chromium context that cannot see the body <style>'s @font-face, so
// the band's font would never resolve. Pull just the normal-weight Inter face out of the shared blob
// and inline it; the band renders one weight, so the other faces would only bloat every page.
const INTER_FACE_CSS = (FONT_FACE_CSS.match(
  /@font-face\{[^}]*font-family:'Inter'[^}]*font-style:normal[^}]*font-weight:400[^}]*\}/,
) ?? [""])[0];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Schema defaults are the single source of truth for these meta controls; reading them here keeps the
// render layer from drifting from the values the editor shows.
function schemaNumber(id: string, fallback: number): number {
  const def = schema.controls[id]?.default;
  return typeof def === "number" ? def : fallback;
}

function schemaString(id: string, fallback: string): string {
  const def = schema.controls[id]?.default;
  return typeof def === "string" ? def : fallback;
}

function schemaBound(id: string, edge: "min" | "max", fallback: number): number {
  const value = schema.controls[id]?.[edge];
  return typeof value === "number" ? value : fallback;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
}

// Map the align control to a flex keyword. An unknown value falls to flex-start, so no crafted theme
// value can reach the inline style — the keyword set is closed here (the meta-control validation point).
function justify(align: string): string {
  return align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
}

// A template element inherits nothing and renders at font-size:0; styling is fully inline. The Inter
// face is inlined alongside so the band's font resolves inside the isolated print context. The two-span
// contents (title+date, title+page) sit together at the aligned edge with a gap between them.
function band(inner: string, fontSizePt: number, color: string, align: string): string {
  const style = [
    "width: 100%",
    "box-sizing: border-box",
    "padding: 0 12mm",
    "display: flex",
    `justify-content: ${justify(align)}`,
    "align-items: center",
    "gap: 0.75em",
    `font-size: ${fontSizePt}pt`,
    `font-family: ${FontStack.sans}`,
    `color: ${color}`,
  ].join("; ");
  return `<style>${INTER_FACE_CSS}</style><div style="${style}">${inner}</div>`;
}

function span(text: string): string {
  return `<span>${text}</span>`;
}

const PAGE_NUMBER = '<span class="pageNumber"></span>';
const TOTAL_PAGES = '<span class="totalPages"></span>';

function headerInner(content: string, title: string, date: string): string {
  switch (content) {
    case HeaderContent.title:
      return span(title);
    case HeaderContent.date:
      return span(date);
    case HeaderContent.titleDate:
      return span(title) + span(date);
    default:
      return "";
  }
}

function footerInner(content: string, title: string, pageWord: string): string {
  switch (content) {
    case FooterContent.page:
      return span(`${pageWord} ${PAGE_NUMBER}`);
    case FooterContent.pageTotal:
      return span(`${PAGE_NUMBER} / ${TOTAL_PAGES}`);
    case FooterContent.titlePage:
      return span(title) + span(`${pageWord} ${PAGE_NUMBER}`);
    default:
      return "";
  }
}

/**
 * Build the print metadata both shells feed to their PDF primitive. Header/footer settings live in
 * `theme.values` (meta controls), so they ride along with the theme; this is the single place that
 * turns them into Chromium templates, keeping the two ports free of duplicated layout logic.
 *
 * `meta` controls skip generateCss's emitters, so their values are validated here instead: the color
 * is bounded to a hex literal and the font size clamped to the schema range, closing the path from a
 * crafted theme value into the print document's inline styles.
 */
export function buildPrintMeta(theme: Theme, locale: Locale = DEFAULT_LOCALE): PrintMeta {
  const values = theme.values;

  const fontSize = clamp(
    num(values["headerFooter.fontSize"], schemaNumber("headerFooter.fontSize", 9)),
    schemaBound("headerFooter.fontSize", "min", 6),
    schemaBound("headerFooter.fontSize", "max", 14),
  );
  const rawColor = str(values["headerFooter.color"], "");
  const color = isHexColor(rawColor) ? rawColor : schemaString("headerFooter.color", "#64748b");

  const headerContent = str(values["header.content"], HeaderContent.title);
  const footerContent = str(values["footer.content"], FooterContent.page);
  const headerAlign = str(values["header.align"], schemaString("header.align", "left"));
  const footerAlign = str(values["footer.align"], schemaString("footer.align", "center"));

  const title = escapeHtml(theme.name);
  const date = escapeHtml(formatDate(locale));
  const pageWord = escapeHtml(message("footerPage", locale));

  // The band reserve and the active flags live in pageGeometry so the +12mm exists in exactly one
  // place; the preview frame reads the same geometry and never re-derives the margins.
  const geom = pageGeometry(theme, locale);
  const headerBody = geom.headerActive ? headerInner(headerContent, title, date) : "";
  const footerBody = geom.footerActive ? footerInner(footerContent, title, pageWord) : "";

  return {
    // Chromium requires this flag for either band; an empty template simply prints nothing.
    displayHeaderFooter: geom.headerActive || geom.footerActive,
    headerTemplate: geom.headerActive
      ? band(headerBody, fontSize, color, headerAlign)
      : "<span></span>",
    footerTemplate: geom.footerActive
      ? band(footerBody, fontSize, color, footerAlign)
      : "<span></span>",
    marginTopMm: geom.margin.topMm,
    marginRightMm: geom.margin.rightMm,
    marginBottomMm: geom.margin.bottomMm,
    marginLeftMm: geom.margin.leftMm,
  };
}

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
import { bool, num, str } from "./themeValue";

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

// Templates print outside the page body; the edge they sit on needs room or the body overlaps them.
const TEMPLATE_RESERVE_MM = 12;

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

// A template element inherits nothing and renders at font-size:0; styling is fully inline. The Inter
// face is inlined alongside so the band's font resolves inside the isolated print context.
function band(inner: string, fontSizePt: number, color: string): string {
  const style = [
    "width: 100%",
    "box-sizing: border-box",
    "padding: 0 12mm",
    "display: flex",
    "justify-content: space-between",
    "align-items: center",
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

  const headerShown = bool(values["header.show"], false);
  const footerShown = bool(values["footer.show"], true);
  const headerContent = str(values["header.content"], HeaderContent.title);
  const footerContent = str(values["footer.content"], FooterContent.page);

  const title = escapeHtml(theme.name);
  const date = escapeHtml(formatDate(locale));
  const pageWord = escapeHtml(message("footerPage", locale));

  const headerBody = headerShown ? headerInner(headerContent, title, date) : "";
  const footerBody = footerShown ? footerInner(footerContent, title, pageWord) : "";

  const headerActive = headerBody !== "";
  const footerActive = footerBody !== "";

  const baseTop = num(values["page.marginTop"], schemaNumber("page.marginTop", 20));
  const baseRight = num(values["page.marginRight"], schemaNumber("page.marginRight", 18));
  const baseBottom = num(values["page.marginBottom"], schemaNumber("page.marginBottom", 20));
  const baseLeft = num(values["page.marginLeft"], schemaNumber("page.marginLeft", 18));

  return {
    // Chromium requires this flag for either band; an empty template simply prints nothing.
    displayHeaderFooter: headerActive || footerActive,
    headerTemplate: headerActive ? band(headerBody, fontSize, color) : "<span></span>",
    footerTemplate: footerActive ? band(footerBody, fontSize, color) : "<span></span>",
    marginTopMm: headerActive ? baseTop + TEMPLATE_RESERVE_MM : baseTop,
    marginRightMm: baseRight,
    marginBottomMm: footerActive ? baseBottom + TEMPLATE_RESERVE_MM : baseBottom,
    marginLeftMm: baseLeft,
  };
}

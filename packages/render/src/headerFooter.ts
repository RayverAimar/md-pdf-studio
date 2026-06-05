import {
  DEFAULT_LOCALE,
  FONT_FACE_CSS,
  FontStack,
  isHexColor,
  type Locale,
  message,
  type Theme,
} from "@md-pdf-studio/core";
import { pageGeometry } from "./pageGeometry";
import { num, schemaBound, schemaNumber, schemaString, str } from "./themeValue";

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

// The template runs in an isolated Chromium context that cannot see the body <style>'s @font-face, so
// the band's font would never resolve. Pull just the normal-weight Inter face out of the shared blob
// and inline it; the band renders one weight, so the other faces would only bloat every page.
const INTER_FACE_CSS = (FONT_FACE_CSS.match(
  /@font-face\{[^}]*font-family:'Inter'[^}]*font-style:normal[^}]*font-weight:400[^}]*\}/,
) ?? [""])[0];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

const PAGE_NUMBER = '<span class="pageNumber"></span>';
const TOTAL_PAGES = '<span class="totalPages"></span>';

// One slot's printed content for its chosen token. "none" — or any unrecognized value from a crafted or
// legacy theme — prints nothing, so this switch is the meta-control validation point: a slot value can
// never reach the band markup as anything but one of these fixed shapes (title/date are pre-escaped).
function slotInner(token: string, title: string, date: string, pageWord: string): string {
  switch (token) {
    case "title":
      return title;
    case "date":
      return date;
    case "page":
      return `${pageWord} ${PAGE_NUMBER}`;
    case "page-total":
      return `${PAGE_NUMBER} / ${TOTAL_PAGES}`;
    default:
      return "";
  }
}

// A template element inherits nothing and renders at font-size:0; styling is fully inline. The Inter face
// is inlined alongside so the band's font resolves in the isolated print context. The three slots sit at
// the start / center / end via space-between, so an empty slot still anchors the others to their edge.
function band(
  left: string,
  center: string,
  right: string,
  fontSizePt: number,
  color: string,
): string {
  const style = [
    "width: 100%",
    "box-sizing: border-box",
    "padding: 0 12mm",
    "display: flex",
    "justify-content: space-between",
    "align-items: center",
    "gap: 0.75em",
    `font-size: ${fontSizePt}pt`,
    `font-family: ${FontStack.sans}`,
    `color: ${color}`,
  ].join("; ");
  return `<style>${INTER_FACE_CSS}</style><div style="${style}"><span>${left}</span><span>${center}</span><span>${right}</span></div>`;
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

  const title = escapeHtml(theme.name);
  const date = escapeHtml(formatDate(locale));
  const pageWord = escapeHtml(message("footerPage", locale));

  // Resolve one slot to its printed content, falling back to the slot's schema default when unset.
  const slotOf = (id: string, fallback: string): string =>
    slotInner(str(values[id], schemaString(id, fallback)), title, date, pageWord);

  // The band reserve and the active flags live in pageGeometry so the +12mm exists in exactly one
  // place; the preview frame reads the same geometry and never re-derives the margins.
  const geom = pageGeometry(theme, locale);

  return {
    // Chromium requires this flag for either band; an empty template simply prints nothing.
    displayHeaderFooter: geom.headerActive || geom.footerActive,
    headerTemplate: geom.headerActive
      ? band(
          slotOf("header.left", "title"),
          slotOf("header.center", "none"),
          slotOf("header.right", "date"),
          fontSize,
          color,
        )
      : "<span></span>",
    footerTemplate: geom.footerActive
      ? band(
          slotOf("footer.left", "none"),
          slotOf("footer.center", "page"),
          slotOf("footer.right", "none"),
          fontSize,
          color,
        )
      : "<span></span>",
    marginTopMm: geom.margin.topMm,
    marginRightMm: geom.margin.rightMm,
    marginBottomMm: geom.margin.bottomMm,
    marginLeftMm: geom.margin.leftMm,
  };
}

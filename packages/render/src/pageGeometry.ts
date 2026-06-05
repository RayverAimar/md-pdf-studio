import { DEFAULT_LOCALE, type Locale, type Theme } from "@md-pdf-studio/core";
import { bool, num, schemaNumber, schemaString, str } from "./themeValue";

/** The `page.size` enum, which is what `preferCSSPageSize` selects in the PDF. */
export type PageSize = "A4" | "Letter" | "Legal";

/** Physical sheet dimensions per page size, in millimetres. */
interface PageDimensions {
  widthMm: number;
  heightMm: number;
}

// Single source for the printed sheet's physical size. The UI's preview frame and any future
// pagination both read these, so the per-size table can never diverge from what the PDF prints.
const PAGE_DIMENSIONS: Readonly<Record<PageSize, PageDimensions>> = {
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
  Legal: { widthMm: 215.9, heightMm: 355.6 },
};

const DEFAULT_PAGE_SIZE: PageSize = "A4";

// A header/footer template prints in the strip just outside the body, so the edge it sits on must
// reserve room or the content overlaps it. This is the ONE place the reserve is defined: both the PDF
// (buildPrintMeta) and the preview frame derive their effective margins from pageGeometry, so the
// +12mm can never be re-added independently in either path.
export const TEMPLATE_RESERVE_MM = 12;

function isPageSize(value: string): value is PageSize {
  return value === "A4" || value === "Letter" || value === "Legal";
}

// The tokens a slot can print; mirrors headerFooter's slotInner so "active" matches "renders something".
const SLOT_CONTENT: ReadonlySet<string> = new Set(["title", "date", "page", "page-total"]);

// A band renders (and reserves margin) only when at least one slot holds a printable token; "none" or a
// crafted/legacy value reserves nothing, exactly as slotInner returns "" for it.
function bandHasContent(values: Theme["values"], prefix: string): boolean {
  return ["left", "center", "right"].some((pos) => {
    const id = `${prefix}.${pos}`;
    return SLOT_CONTENT.has(str(values[id], schemaString(id, "none")));
  });
}

/** The printed sheet geometry both the PDF and the preview must frame the content column with. */
export interface PageGeometry {
  /** What `preferCSSPageSize` selects; drives the physical sheet dimensions. */
  pageSize: PageSize;
  widthMm: number;
  heightMm: number;
  /** Effective margins: base page.margin* plus the band reserve on each active header/footer edge. */
  margin: { topMm: number; rightMm: number; bottomMm: number; leftMm: number };
  /** The reserve actually applied per edge (0 or TEMPLATE_RESERVE_MM); the band's strip height. */
  reserve: { topMm: number; bottomMm: number };
  headerActive: boolean;
  footerActive: boolean;
}

/**
 * Resolve the printed sheet geometry from a theme: physical size, plus the effective body margins that
 * already account for the header/footer band reserve. The two render ports widen the body margin by
 * this reserve and the preview frame pads its sheet by the same amount, so a content line wraps and
 * positions identically in the preview and the PDF.
 *
 * `locale` is accepted for symmetry with buildPrintMeta but does not affect geometry today; it is kept
 * so callers can pass a single value through both functions without a second signature.
 */
export function pageGeometry(theme: Theme, _locale: Locale = DEFAULT_LOCALE): PageGeometry {
  const values = theme.values;

  const rawSize = str(values["page.size"], DEFAULT_PAGE_SIZE);
  const pageSize = isPageSize(rawSize) ? rawSize : DEFAULT_PAGE_SIZE;
  const dimensions = PAGE_DIMENSIONS[pageSize];

  const baseTop = num(values["page.marginTop"], schemaNumber("page.marginTop", 20));
  const baseRight = num(values["page.marginRight"], schemaNumber("page.marginRight", 18));
  const baseBottom = num(values["page.marginBottom"], schemaNumber("page.marginBottom", 20));
  const baseLeft = num(values["page.marginLeft"], schemaNumber("page.marginLeft", 18));

  const headerActive = bool(values["header.show"], false) && bandHasContent(values, "header");
  const footerActive = bool(values["footer.show"], true) && bandHasContent(values, "footer");

  const reserveTop = headerActive ? TEMPLATE_RESERVE_MM : 0;
  const reserveBottom = footerActive ? TEMPLATE_RESERVE_MM : 0;

  return {
    pageSize,
    widthMm: dimensions.widthMm,
    heightMm: dimensions.heightMm,
    margin: {
      topMm: baseTop + reserveTop,
      rightMm: baseRight,
      bottomMm: baseBottom + reserveBottom,
      leftMm: baseLeft,
    },
    reserve: { topMm: reserveTop, bottomMm: reserveBottom },
    headerActive,
    footerActive,
  };
}

/** Physical sheet width in millimetres for a `page.size` value, falling back for unknown sizes. */
export function pageWidthMm(pageSize: string): number {
  return isPageSize(pageSize)
    ? PAGE_DIMENSIONS[pageSize].widthMm
    : PAGE_DIMENSIONS[DEFAULT_PAGE_SIZE].widthMm;
}

import { CssClass } from "./constants";

// Render-time HTML fixes for Chromium, applied to sanitized HTML right before it goes to the PDF
// engine. The code-block overflow and white-space fixes live in the base stylesheet, not here.

const HEADING_ID_PATTERN = /<h[1-6]\b[^>]*\bid="([^"]+)"/g;
const OPENLESS_DETAILS_PATTERN = /<details(?![^>]*\bopen\b)/g;
const HIDDEN_ANCHOR_STYLE = "position:absolute;width:0;height:0;overflow:hidden";

/** Extract heading ids in document order, used to resolve each heading to a page after the first pass. */
export function extractHeadingIds(html: string): string[] {
  const ids: string[] = [];
  for (const match of html.matchAll(HEADING_ID_PATTERN)) {
    const id = match[1];
    if (id !== undefined) ids.push(id);
  }
  return ids;
}

/**
 * Force `<details>` open (Chromium prints them collapsed) and append a hidden anchor per heading so
 * Chromium emits a named destination for each — the hook the page reader uses to locate headings.
 */
export function applyTransforms(html: string): string {
  const opened = html.replace(OPENLESS_DETAILS_PATTERN, "<details open");
  const ids = extractHeadingIds(opened);
  if (ids.length === 0) return opened;
  const anchors = ids.map((id) => `<a href="#${id}"></a>`).join("");
  return `${opened}<nav class="${CssClass.tocAnchors}" aria-hidden="true" style="${HIDDEN_ANCHOR_STYLE}">${anchors}</nav>`;
}

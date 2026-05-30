import {
  applyTransforms,
  BASE_CSS,
  CssClass,
  generateCss,
  renderMarkdown,
  sanitizeHtml,
  schema,
  type Theme,
} from "@md-pdf-studio/core";

/** A heading discovered in the rendered content, with the data a TOC entry needs. */
export interface Heading {
  id: string;
  level: number;
  text: string;
}

/** Page number resolved for each heading id (1-based). Missing ids simply have no entry. */
export type HeadingPages = Record<string, number>;

export interface PreparedContent {
  /** Sanitized body HTML with render transforms (forced-open details, hidden anchors) applied. */
  contentHtml: string;
  headings: Heading[];
}

const HEADING_PATTERN = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g;
const ID_ATTR_PATTERN = /\bid="([^"]+)"/;
const TAG_PATTERN = /<[^>]+>/g;
const DEFAULT_TOC_MAX_LEVEL = 3;

function stripTags(html: string): string {
  return html.replace(TAG_PATTERN, "").trim();
}

/** Pull heading id, level and text out of rendered HTML, in document order. */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of html.matchAll(HEADING_PATTERN)) {
    const level = Number(match[1]);
    const attrs = match[2] ?? "";
    const inner = match[3] ?? "";
    const idMatch = ID_ATTR_PATTERN.exec(attrs);
    if (idMatch?.[1] === undefined) continue;
    headings.push({ id: idMatch[1], level, text: stripTags(inner) });
  }
  return headings;
}

/** Render Markdown through the full safe pipeline and collect its headings. */
export function prepareContent(markdown: string): PreparedContent {
  const sanitized = sanitizeHtml(renderMarkdown(markdown));
  return {
    contentHtml: applyTransforms(sanitized),
    headings: extractHeadings(sanitized),
  };
}

export interface TocOptions {
  maxLevel?: number;
}

/** Build the visible table of contents. Entries whose page is unknown render without a number. */
export function buildTocHtml(
  headings: Heading[],
  pages: HeadingPages,
  options: TocOptions = {},
): string {
  const maxLevel = options.maxLevel ?? DEFAULT_TOC_MAX_LEVEL;
  const visible = headings.filter((heading) => heading.level <= maxLevel);
  if (visible.length === 0) return "";

  const entries = visible
    .map((heading) => {
      const page = pages[heading.id];
      const pageLabel = page === undefined ? "" : String(page);
      return (
        `<a class="${CssClass.tocEntry}" href="#${heading.id}" data-level="${heading.level}">` +
        `<span class="${CssClass.tocLabel}">${heading.text}</span>` +
        `<span class="${CssClass.tocPageNumber}">${pageLabel}</span>` +
        `</a>`
      );
    })
    .join("");

  return `<nav class="${CssClass.toc}">${entries}</nav>`;
}

/** Assemble the full HTML document Chromium will print: theme CSS + the mdp content root. */
export function buildDocument(theme: Theme, innerHtml: string): string {
  const css = `${BASE_CSS}\n${generateCss(schema, theme)}`;
  return (
    "<!DOCTYPE html>" +
    '<html><head><meta charset="utf-8"><style>' +
    css +
    `</style></head><body><div class="${CssClass.root}">` +
    innerHtml +
    "</div></body></html>"
  );
}

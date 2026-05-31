import sanitizeHtmlLib from "sanitize-html";

// Shared allowlist. Preview (DOMPurify, in the browser) and render (sanitize-html, in Node) must
// strip the same things, so both import these constants. This guards the raw HTML a Markdown document
// may carry — script tags, event handlers, javascript: URLs.
export const ALLOWED_TAGS: string[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "span",
  "strong",
  "em",
  "del",
  "s",
  "sub",
  "sup",
  "hr",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "figure",
  "figcaption",
  "details",
  "summary",
  "nav",
  "div",
  "section",
  "input",
];

export const ALLOWED_ATTR: string[] = [
  "class",
  "id",
  "style",
  "href",
  "src",
  "alt",
  "title",
  "data-mdp-el",
  "colspan",
  "rowspan",
  "align",
  "open",
  "target",
  "rel",
  "type",
  "checked",
  "disabled",
];

// One URL-scheme policy both shells share. `data:` is allowed only on <img src> so base64-embedded
// images survive; this matches DOMPurify's client default (data: permitted on media tags only, where an
// <img>-loaded SVG cannot run script), keeping preview and PDF in agreement.
export const ALLOWED_SCHEMES: string[] = ["http", "https", "mailto", "tel"];
export const IMG_ALLOWED_SCHEMES: string[] = [...ALLOWED_SCHEMES, "data"];

const config: sanitizeHtmlLib.IOptions = {
  allowedTags: ALLOWED_TAGS,
  // `style` is kept verbatim (no allowedStyles) so Shiki's `var(--shiki-*)` token colors survive.
  // Inline style cannot execute script in modern engines; the XSS surface is tags/handlers/URLs.
  allowedAttributes: { "*": ALLOWED_ATTR },
  allowedSchemes: ALLOWED_SCHEMES,
  allowedSchemesByTag: { img: IMG_ALLOWED_SCHEMES },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
};

/** Strip script-bearing tags/attributes/URLs from raw HTML, preserving the mdp + Shiki markup. */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, config);
}

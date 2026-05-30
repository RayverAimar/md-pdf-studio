import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { CssClass, ELEMENT_ATTRIBUTE, ElementKey } from "./constants";
import { highlightCode } from "./highlight";

interface ElementDecoration {
  className: string;
  elementKey: string;
}

// Maps the HTML tag markdown-it produces to the class + element identity we attach to it.
const DECORATION_BY_TAG: Record<string, ElementDecoration> = {
  h1: { className: CssClass.heading1, elementKey: ElementKey.heading1 },
  h2: { className: CssClass.heading2, elementKey: ElementKey.heading2 },
  h3: { className: CssClass.heading3, elementKey: ElementKey.heading3 },
  h4: { className: CssClass.heading4, elementKey: ElementKey.heading4 },
  h5: { className: CssClass.heading5, elementKey: ElementKey.heading5 },
  h6: { className: CssClass.heading6, elementKey: ElementKey.heading6 },
  p: { className: CssClass.paragraph, elementKey: ElementKey.body },
  a: { className: CssClass.link, elementKey: ElementKey.link },
  blockquote: { className: CssClass.blockquote, elementKey: ElementKey.blockquote },
  table: { className: CssClass.table, elementKey: ElementKey.table },
  ul: { className: CssClass.listUnordered, elementKey: ElementKey.list },
  ol: { className: CssClass.listOrdered, elementKey: ElementKey.list },
  li: { className: CssClass.listItem, elementKey: ElementKey.list },
  hr: { className: CssClass.horizontalRule, elementKey: ElementKey.horizontalRule },
  em: { className: CssClass.emphasis, elementKey: ElementKey.emphasis },
  strong: { className: CssClass.strong, elementKey: ElementKey.emphasis },
};

const HEADING_TAGS: Set<string> = new Set([
  ElementKey.heading1,
  ElementKey.heading2,
  ElementKey.heading3,
  ElementKey.heading4,
  ElementKey.heading5,
  ElementKey.heading6,
]);

const HEADING_OPEN = "heading_open";
const CODE_INLINE = "code_inline";
const FALLBACK_HEADING_SLUG = "section";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueHeadingId(text: string, usedIds: Set<string>): string {
  const base = slugify(text) || FALLBACK_HEADING_SLUG;
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function decorateToken(token: Token, headingText: string | null, usedIds: Set<string>): void {
  const decoration = DECORATION_BY_TAG[token.tag];
  if (decoration !== undefined) {
    token.attrJoin("class", decoration.className);
    token.attrSet(ELEMENT_ATTRIBUTE, decoration.elementKey);
  }
  // A stable, de-duplicated id is what lets the two-pass render resolve each heading to a page.
  if (headingText !== null && HEADING_TAGS.has(token.tag)) {
    token.attrSet("id", uniqueHeadingId(headingText, usedIds));
  }
}

function addElementDecoration(md: MarkdownIt): void {
  md.core.ruler.push("mdp_decorate", (state) => {
    const usedIds = new Set<string>();
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token === undefined) continue;
      const headingText = token.type === HEADING_OPEN ? (tokens[i + 1]?.content ?? "") : null;
      decorateToken(token, headingText, usedIds);
      if (token.children !== null) {
        for (const child of token.children) {
          decorateToken(child, null, usedIds);
        }
      }
    }
    return true;
  });

  // markdown-it's own code_inline renderer drops token attrs, so emit the class explicitly.
  const escapeHtml = md.utils.escapeHtml;
  md.renderer.rules[CODE_INLINE] = (tokens, index) => {
    const content = tokens[index]?.content ?? "";
    return `<code class="${CssClass.codeInline}">${escapeHtml(content)}</code>`;
  };
}

const md = new MarkdownIt({
  // Raw HTML is preserved here and removed later by sanitizeHtml, not dropped at parse time.
  html: true,
  linkify: true,
  typographer: false,
  highlight: (code, lang) => highlightCode(code, lang),
});

addElementDecoration(md);

/** Render Markdown to unsanitized HTML carrying mdp classes, heading ids and element markers. */
export function renderMarkdown(markdown: string): string {
  return md.render(markdown);
}

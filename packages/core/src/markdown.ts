/// <reference path="./markdown-plugins.d.ts" />
import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
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
  img: { className: CssClass.image, elementKey: ElementKey.image },
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
const FOOTNOTE_BLOCK_OPEN = "footnote_block_open";
const FOOTNOTE_REF = "footnote_ref";
const FALLBACK_HEADING_SLUG = "section";
const FIGCAPTION_TOKEN = "mdp_figcaption";

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

// markdown-it-footnote renders the separator <hr> as a sibling of <section class="footnotes">; the
// style engine targets `.mdp-footnotes hr`, so we re-open the block with the hr as a child and stamp
// our own classes onto the section and reference markers.
function decorateFootnotes(md: MarkdownIt): void {
  md.renderer.rules[FOOTNOTE_BLOCK_OPEN] = () =>
    `<section class="${CssClass.footnotes}">\n<hr class="footnotes-sep">\n<ol class="footnotes-list">\n`;

  const renderRef = md.renderer.rules[FOOTNOTE_REF];
  if (renderRef !== undefined) {
    md.renderer.rules[FOOTNOTE_REF] = (tokens, index, options, env, self) =>
      renderRef(tokens, index, options, env, self).replace(
        '<sup class="footnote-ref">',
        `<sup class="footnote-ref ${CssClass.footnoteRef}">`,
      );
  }
}

// A paragraph whose only inline content is a single image becomes a <figure> so image.align and the
// caption controls have markup to target; the image keeps its own decoration via the inline render.
function loneImage(token: Token | undefined): Token | null {
  if (token === undefined || token.type !== "inline" || token.children === null) return null;
  if (token.children.length !== 1) return null;
  const child = token.children[0];
  return child !== undefined && child.type === "image" ? child : null;
}

function captionText(image: Token): string {
  const title = image.attrGet("title");
  if (title !== null && title.length > 0) return title;
  return image.content;
}

function addFigures(md: MarkdownIt): void {
  md.core.ruler.before("mdp_decorate", "mdp_figure", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i += 1) {
      const open = tokens[i];
      const close = tokens[i + 2];
      const image = loneImage(tokens[i + 1]);
      if (image === null || open?.type !== "paragraph_open" || close?.type !== "paragraph_close") {
        continue;
      }

      open.tag = "figure";
      open.attrSet("class", CssClass.figure);
      open.attrSet(ELEMENT_ATTRIBUTE, ElementKey.image);
      close.tag = "figure";

      const caption = captionText(image);
      if (caption.length > 0) {
        const figcaption = new state.Token(FIGCAPTION_TOKEN, "figcaption", 0);
        figcaption.content = caption;
        tokens.splice(i + 2, 0, figcaption);
        i += 1;
      }
    }
    return true;
  });

  const escapeHtml = md.utils.escapeHtml;
  md.renderer.rules[FIGCAPTION_TOKEN] = (tokens, index) => {
    const content = tokens[index]?.content ?? "";
    return `<figcaption class="${CssClass.figcaption}">${escapeHtml(content)}</figcaption>\n`;
  };
}

const md = new MarkdownIt({
  // Raw HTML is preserved here and removed later by sanitizeHtml, not dropped at parse time.
  html: true,
  linkify: true,
  typographer: false,
  highlight: (code, lang) => highlightCode(code, lang),
});

md.use(footnote);
// `enabled: false` keeps the checkbox non-interactive (rendered with `disabled`) for a static PDF.
md.use(taskLists, { enabled: false, label: false });

addElementDecoration(md);
addFigures(md);
decorateFootnotes(md);

/** Render Markdown to unsanitized HTML carrying mdp classes, heading ids and element markers. */
export function renderMarkdown(markdown: string): string {
  return md.render(markdown);
}

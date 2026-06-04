// Single source of truth for every literal that crosses module boundaries: class names, CSS custom
// properties, section labels and the color palette. Anything referenced in more than one place lives
// here so a rename can never leave two copies out of sync.

/** Attribute stamped on rendered nodes; its value is an ElementKey the editor maps to a section. */
export const ELEMENT_ATTRIBUTE = "data-mdp-el";

/** Logical element identity shared by the renderer (data-mdp-el) and the controls panel. */
export const ElementKey = {
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  heading4: "h4",
  heading5: "h5",
  heading6: "h6",
  body: "body",
  link: "link",
  list: "list",
  blockquote: "blockquote",
  table: "table",
  emphasis: "emphasis",
  horizontalRule: "hr",
  image: "image",
} as const;
export type ElementKey = (typeof ElementKey)[keyof typeof ElementKey];

const ELEMENT_KEYS: readonly string[] = Object.values(ElementKey);

/** Narrow a raw `data-mdp-el` attribute to an ElementKey without an unchecked cast. */
export function isElementKey(value: string): value is ElementKey {
  return ELEMENT_KEYS.includes(value);
}

/** Class applied to each rendered element. One class per element keeps specificity even. */
export const CssClass = {
  root: "mdp",
  heading1: "mdp-h1",
  heading2: "mdp-h2",
  heading3: "mdp-h3",
  heading4: "mdp-h4",
  heading5: "mdp-h5",
  heading6: "mdp-h6",
  paragraph: "mdp-p",
  link: "mdp-link",
  blockquote: "mdp-blockquote",
  table: "mdp-table",
  listUnordered: "mdp-ul",
  listOrdered: "mdp-ol",
  listItem: "mdp-li",
  horizontalRule: "mdp-hr",
  emphasis: "mdp-em",
  strong: "mdp-strong",
  codeInline: "mdp-code-inline",
  codeBlock: "mdp-codeblock",
  image: "mdp-img",
  figure: "mdp-figure",
  figcaption: "mdp-figcaption",
  taskItem: "mdp-task",
  footnotes: "mdp-footnotes",
  footnoteRef: "mdp-fnref",
  tocAnchors: "mdp-toc-anchors",
  toc: "mdp-toc",
  tocTitle: "mdp-toc-title",
  tocEntry: "mdp-toc-entry",
  tocLabel: "mdp-toc-label",
  tocLeader: "mdp-toc-leader",
  tocPageNumber: "mdp-toc-page",
} as const;

const asSelector = (className: string): string => `.${className}`;

/** Selectors used by the CSS generator, derived from CssClass so they can never drift from the markup. */
export const Selector = {
  root: asSelector(CssClass.root),
  heading1: asSelector(CssClass.heading1),
  heading2: asSelector(CssClass.heading2),
  heading3: asSelector(CssClass.heading3),
  heading4: asSelector(CssClass.heading4),
  heading5: asSelector(CssClass.heading5),
  heading6: asSelector(CssClass.heading6),
  paragraph: asSelector(CssClass.paragraph),
  link: asSelector(CssClass.link),
  emphasis: asSelector(CssClass.emphasis),
  strong: asSelector(CssClass.strong),
  blockquote: asSelector(CssClass.blockquote),
  table: asSelector(CssClass.table),
  codeInline: asSelector(CssClass.codeInline),
  codeBlock: asSelector(CssClass.codeBlock),
  horizontalRule: asSelector(CssClass.horizontalRule),
  listUnordered: asSelector(CssClass.listUnordered),
  listOrdered: asSelector(CssClass.listOrdered),
  listItem: asSelector(CssClass.listItem),
  listMarker: `${asSelector(CssClass.listItem)}::marker`,
  taskCheckbox: `${asSelector(CssClass.listItem)} input[type=checkbox]`,
  image: asSelector(CssClass.image),
  figure: asSelector(CssClass.figure),
  figcaption: asSelector(CssClass.figcaption),
  footnotes: asSelector(CssClass.footnotes),
  footnotesSeparator: `${asSelector(CssClass.footnotes)} hr`,
  toc: asSelector(CssClass.toc),
  tocTitle: asSelector(CssClass.tocTitle),
  tocEntry: asSelector(CssClass.tocEntry),
  tocLabel: asSelector(CssClass.tocLabel),
  tocLeader: asSelector(CssClass.tocLeader),
  tocPageNumber: asSelector(CssClass.tocPageNumber),
  tableHeaderCell: `${asSelector(CssClass.table)} th`,
  tableBodyCell: `${asSelector(CssClass.table)} td`,
  tableAnyCell: `${asSelector(CssClass.table)} td, ${asSelector(CssClass.table)} th`,
  tableRow: `${asSelector(CssClass.table)} tr`,
  tableStripeRow: `${asSelector(CssClass.table)} tbody tr:nth-child(even)`,
  blockquoteNested: `${asSelector(CssClass.blockquote)} ${asSelector(CssClass.blockquote)}`,
  listNested: `${asSelector(CssClass.listItem)} ${asSelector(CssClass.listUnordered)}, ${asSelector(CssClass.listItem)} ${asSelector(CssClass.listOrdered)}`,
  allHeadings: [
    asSelector(CssClass.heading1),
    asSelector(CssClass.heading2),
    asSelector(CssClass.heading3),
    asSelector(CssClass.heading4),
    asSelector(CssClass.heading5),
    asSelector(CssClass.heading6),
  ].join(","),
  codeBlockText: `${asSelector(CssClass.codeBlock)}, ${asSelector(CssClass.codeBlock)} code`,
} as const;

/** Our own CSS custom properties, referenced by both the control that sets them and the rules that read them. */
export const CssVar = {
  tableBorder: "--mdp-table-border",
  tableStripe: "--mdp-table-stripe",
  tableBorderWidth: "--mdp-table-border-width",
  listIndent: "--mdp-list-indent",
  tocIndent: "--mdp-toc-indent",
  link: "--mdp-link",
} as const;

/** Wrap a custom-property name in a `var(...)` reference. */
export const cssVarRef = (name: string): string => `var(${name})`;

// Shiki's css-variables theme emits these exact names (default `--shiki-` prefix). They are an
// external contract: syntax-color controls write them, Shiki's inline styles read them.
export const ShikiVar = {
  foreground: "--shiki-foreground",
  background: "--shiki-background",
  tokenComment: "--shiki-token-comment",
  tokenKeyword: "--shiki-token-keyword",
  tokenString: "--shiki-token-string",
  tokenConstant: "--shiki-token-constant",
  tokenFunction: "--shiki-token-function",
  tokenVariable: "--shiki-token-variable",
  tokenPunctuation: "--shiki-token-punctuation",
} as const;

// Stable id for the section a control appears under. The visible label is resolved per locale in i18n,
// never stored here, so a control's grouping is language-independent.
export const Section = {
  page: "page",
  body: "body",
  headings: "headings",
  links: "links",
  codeInline: "code-inline",
  codeBlock: "code-block",
  codeColors: "code-colors",
  emphasis: "emphasis",
  lists: "lists",
  tables: "tables",
  blockquote: "blockquote",
  horizontalRule: "horizontal-rule",
  images: "images",
  footnotes: "footnotes",
  toc: "toc",
  pagination: "pagination",
  headerFooter: "header-footer",
} as const;
export type SectionId = (typeof Section)[keyof typeof Section];

// Central color palette. Schema defaults and presets reference these names rather than raw hex so the
// whole product shares one set of colors the UI can also consume.
export const Palette = {
  white: "#ffffff",
  ink: "#1a1a1a",
  inkStrong: "#0f172a",
  inkHeading: "#111827",
  textMuted: "#475569",
  textFaint: "#64748b",
  border: "#cbd5e1",
  surface: "#f1f5f9",
  surfaceFaint: "#f8fafc",
  link: "#2563eb",
  codeSurface: "#0f172a",
  danger: "#be123c",
  syntaxForeground: "#e2e8f0",
  syntaxKeyword: "#c792ea",
  syntaxString: "#a5d6a7",
  syntaxNumber: "#f78c6c",
  syntaxFunction: "#82aaff",
} as const;

/** Font stacks bundled with the app (preview and PDF must reference identical stacks). */
export const FontStack = {
  sans: "Inter, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "JetBrains Mono, ui-monospace, monospace",
} as const;

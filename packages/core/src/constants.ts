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
} as const;
export type ElementKey = (typeof ElementKey)[keyof typeof ElementKey];

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
  tocAnchors: "mdp-toc-anchors",
} as const;

const asSelector = (className: string): string => `.${className}`;

/** Selectors used by the CSS generator, derived from CssClass so they can never drift from the markup. */
export const Selector = {
  root: asSelector(CssClass.root),
  heading1: asSelector(CssClass.heading1),
  heading2: asSelector(CssClass.heading2),
  heading3: asSelector(CssClass.heading3),
  link: asSelector(CssClass.link),
  blockquote: asSelector(CssClass.blockquote),
  table: asSelector(CssClass.table),
  codeInline: asSelector(CssClass.codeInline),
  codeBlock: asSelector(CssClass.codeBlock),
  tableHeaderCell: `${asSelector(CssClass.table)} th`,
  tableAnyCell: `${asSelector(CssClass.table)} td, ${asSelector(CssClass.table)} th`,
  tableRow: `${asSelector(CssClass.table)} tr`,
  tableStripeRow: `${asSelector(CssClass.table)} tbody tr:nth-child(even)`,
  codeBlockText: `${asSelector(CssClass.codeBlock)}, ${asSelector(CssClass.codeBlock)} code`,
} as const;

/** Our own CSS custom properties, referenced by both the control that sets them and the rules that read them. */
export const CssVar = {
  tableBorder: "--mdp-table-border",
  tableStripe: "--mdp-table-stripe",
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
} as const;

/** Section a control appears under in the controls panel. */
export const Section = {
  page: "Page",
  body: "Body",
  headings: "Headings",
  links: "Links",
  codeInline: "Code · inline",
  codeBlock: "Code · block",
  codeColors: "Code · colors",
  tables: "Tables",
  blockquote: "Blockquote",
} as const;

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

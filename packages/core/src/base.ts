import { CssVar, cssVarRef, Selector } from "./constants";

// Structural CSS that is not user-controllable: collapse rules, the border style a width control needs
// to render, and the print fixes that keep code blocks from clipping. Callers prepend this to the
// generated stylesheet. It stays out of generateCss so the golden snapshot covers only schema output.
export const BASE_CSS = [
  `${Selector.root} { margin: 0; }`,
  `${Selector.table} { border-collapse: collapse; width: 100%; }`,
  `${Selector.blockquote} { border-left-style: solid; margin-inline: 0; }`,
  // A transparent 1px border gives the color controls a width to apply to without forcing one on.
  `${Selector.codeInline} { border: 1px solid transparent; }`,
  `${Selector.codeBlock} { overflow: visible; white-space: pre-wrap; word-break: break-word; border: 1px solid transparent; }`,
  `${Selector.image} { border: 1px solid transparent; }`,
  `${Selector.horizontalRule} { border: 0; border-top-style: solid; }`,
  `${Selector.listUnordered}, ${Selector.listOrdered} { padding-inline-start: ${cssVarRef(CssVar.listIndent)}; }`,
].join("\n");

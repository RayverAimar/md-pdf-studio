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
  // Table-of-contents baseline (Word/LaTeX convention): a vertical list of flex rows whose dotted
  // leader expands to push the page number flush right. This is the structural skeleton the schema
  // controls decorate — font-size, the indent step (--mdp-toc-indent) and the leader dots ride on top.
  `${Selector.toc} { display: block; margin-block: 1.5em; break-inside: avoid; page-break-inside: avoid; }`,
  `${Selector.tocTitle} { margin: 0 0 0.75em; font-weight: 700; }`,
  // Entries are anchors but must read as plain indented text, not links; the inline padding-left the
  // renderer emits supplies the per-level indent and is left untouched here.
  `${Selector.tocEntry} { display: flex; align-items: baseline; text-decoration: none; color: inherit; line-height: 1.6; break-inside: avoid; page-break-inside: avoid; }`,
  `${Selector.tocEntry}[data-level="1"] { font-weight: 600; margin-top: 0.5em; }`,
  `${Selector.tocLabel} { flex: 0 1 auto; }`,
  // The leader fills the gap so the page number sits flush right; the dots themselves are a toggle.
  `${Selector.tocLeader} { flex: 1 1 auto; }`,
  `${Selector.tocPageNumber} { flex: 0 0 auto; padding-left: 0.5em; font-variant-numeric: tabular-nums; }`,
].join("\n");

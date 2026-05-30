import { Selector } from "./constants";

// Structural CSS that is not user-controllable: collapse rules, the border style a width control needs
// to render, and the print fixes that keep code blocks from clipping. Callers prepend this to the
// generated stylesheet. It stays out of generateCss so the golden snapshot covers only schema output.
export const BASE_CSS = [
  `${Selector.root} { margin: 0; }`,
  `${Selector.table} { border-collapse: collapse; width: 100%; }`,
  `${Selector.blockquote} { border-left-style: solid; margin-inline: 0; }`,
  `${Selector.codeInline} { border-radius: 4px; padding: 0.1em 0.3em; }`,
  `${Selector.codeBlock} { overflow: visible; white-space: pre; }`,
  `${Selector.root} img { max-width: 100%; }`,
].join("\n");

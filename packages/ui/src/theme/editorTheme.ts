// The CodeMirror theme for the Markdown SOURCE editor — chrome only. It colors the editor pane, never
// the rendered document (the preview iframe keeps using generateCss + Shiki untouched), so the WYSIWYG
// invariant holds and no second highlighter is introduced.
//
// Built from CM primitives already in the dependency tree: EditorView.theme (re-exported by
// @uiw/react-codemirror) styles the container, and a HighlightStyle fed through syntaxHighlighting
// colors the Lezer syntax tokens. Container colors are single-sourced from the Chrome token object;
// the syntax-token hexes below are sibling literals because a HighlightStyle is constructed at import
// time, before the CSSOM resolves the --ui-* custom properties, and CodeMirror cannot read CSS vars
// for highlight colors. This mirrors the documented ::backdrop-literal pattern in chrome.ts.

import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@uiw/react-codemirror";
import { EditorView } from "@uiw/react-codemirror";
import { Chrome } from "./chrome";

const light = Chrome.color.light;
const dark = Chrome.color.dark;

// var(--ui-font-mono) is the one container value the editor reads from the chrome CSS at runtime; the
// chrome rule .ui-editor-host .cm-editor still owns font-size, so it is deliberately not set here.
const FONT_MONO = "var(--ui-font-mono)";

const lightContainer = EditorView.theme({
  "&": { backgroundColor: light.surface, color: light.text },
  ".cm-content": { caretColor: light.accent },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: light.accent },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "#cfe0ff",
  },
  // textMuted, not the chrome textFaint token: at editor font-size the faint token (#737d8c) lands at
  // 4.17:1 over white, under AA, so the editor gutter steps one token darker to stay readable without
  // re-tuning the shared chrome token (which the dark gutter passes AA with as-is).
  ".cm-gutters": {
    backgroundColor: light.surface,
    color: light.textMuted,
    borderRight: `1px solid ${light.border}`,
  },
  ".cm-activeLineGutter": { backgroundColor: light.surfaceSunken, color: light.text },
  ".cm-lineNumbers .cm-gutterElement": { color: light.textMuted },
  ".cm-scroller": { fontFamily: FONT_MONO },
});

// { dark: true } makes CodeMirror pick its dark-tuned built-ins for anything not overridden here
// (tooltips, panels) so the editor never falls back to a light surface.
const darkContainer = EditorView.theme(
  {
    "&": { backgroundColor: dark.surface, color: dark.text },
    ".cm-content": { caretColor: dark.focus },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: dark.focus },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection": {
      backgroundColor: "#1d3a5f",
    },
    ".cm-selectionBackground": { backgroundColor: "#22304a" },
    ".cm-gutters": {
      backgroundColor: dark.surface,
      color: dark.textFaint,
      borderRight: `1px solid ${dark.border}`,
    },
    ".cm-activeLineGutter": { backgroundColor: dark.surfaceMuted, color: dark.text },
    ".cm-lineNumbers .cm-gutterElement": { color: dark.textFaint },
    ".cm-foldPlaceholder": {
      backgroundColor: dark.surfaceMuted,
      color: dark.textMuted,
      border: "none",
    },
    ".cm-scroller": { fontFamily: FONT_MONO },
  },
  { dark: true },
);

// Syntax-token colors, exported so editorTheme.test.ts asserts each one stays AA against its scheme's
// editor surface — a future palette edit that breaks contrast then fails CI. Every dark hex is
// >=4.5:1 over the #10151f editor surface; every light hex is >=4.5:1 over #ffffff.
export const EDITOR_TOKEN_LIGHT = {
  heading: "#b45309",
  strong: "#111827",
  emphasis: "#374151",
  strikethrough: "#6b7280",
  linkList: "#1d4ed8",
  url: "#1d4ed8",
  monospace: "#0f766e",
  quote: "#4b5563",
  mark: "#6b7280",
  labelName: "#7c3aed",
  string: "#15803d",
  escape: "#7c3aed",
  comment: "#6b7280",
  content: "#1f2937",
} as const;

export const EDITOR_TOKEN_DARK = {
  heading: "#f0a868",
  strong: "#f3f6fb",
  emphasis: "#c0c9d9",
  strikethrough: "#aab4c4",
  linkList: "#7cc4ff",
  url: "#7cc4ff",
  monospace: "#6fd3c2",
  quote: "#9fb0c8",
  mark: "#8893a7",
  labelName: "#d3a0f0",
  string: "#9fd28a",
  escape: "#d3a0f0",
  comment: "#7c879a",
  content: "#e6eaf1",
} as const;

const lightHighlight = HighlightStyle.define([
  { tag: t.heading, color: EDITOR_TOKEN_LIGHT.heading, fontWeight: "600" },
  { tag: t.strong, color: EDITOR_TOKEN_LIGHT.strong, fontWeight: "700" },
  { tag: t.emphasis, color: EDITOR_TOKEN_LIGHT.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, color: EDITOR_TOKEN_LIGHT.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.list], color: EDITOR_TOKEN_LIGHT.linkList },
  { tag: t.url, color: EDITOR_TOKEN_LIGHT.url, textDecoration: "underline" },
  { tag: t.monospace, color: EDITOR_TOKEN_LIGHT.monospace },
  { tag: t.quote, color: EDITOR_TOKEN_LIGHT.quote, fontStyle: "italic" },
  { tag: t.processingInstruction, color: EDITOR_TOKEN_LIGHT.mark },
  { tag: t.contentSeparator, color: EDITOR_TOKEN_LIGHT.mark },
  { tag: t.labelName, color: EDITOR_TOKEN_LIGHT.labelName },
  { tag: t.string, color: EDITOR_TOKEN_LIGHT.string },
  { tag: [t.escape, t.character], color: EDITOR_TOKEN_LIGHT.escape },
  { tag: t.comment, color: EDITOR_TOKEN_LIGHT.comment, fontStyle: "italic" },
  { tag: t.content, color: EDITOR_TOKEN_LIGHT.content },
]);

const darkHighlight = HighlightStyle.define([
  { tag: t.heading, color: EDITOR_TOKEN_DARK.heading, fontWeight: "600" },
  { tag: t.strong, color: EDITOR_TOKEN_DARK.strong, fontWeight: "700" },
  { tag: t.emphasis, color: EDITOR_TOKEN_DARK.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, color: EDITOR_TOKEN_DARK.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.list], color: EDITOR_TOKEN_DARK.linkList },
  { tag: t.url, color: EDITOR_TOKEN_DARK.url, textDecoration: "underline" },
  { tag: t.monospace, color: EDITOR_TOKEN_DARK.monospace },
  { tag: t.quote, color: EDITOR_TOKEN_DARK.quote, fontStyle: "italic" },
  { tag: t.processingInstruction, color: EDITOR_TOKEN_DARK.mark },
  { tag: t.contentSeparator, color: EDITOR_TOKEN_DARK.mark },
  { tag: t.labelName, color: EDITOR_TOKEN_DARK.labelName },
  { tag: t.string, color: EDITOR_TOKEN_DARK.string },
  { tag: [t.escape, t.character], color: EDITOR_TOKEN_DARK.escape },
  { tag: t.comment, color: EDITOR_TOKEN_DARK.comment, fontStyle: "italic" },
  { tag: t.content, color: EDITOR_TOKEN_DARK.content },
]);

// Built once at import time and never per render, so the prop identity only flips when the scheme
// toggles; @uiw/react-codemirror then reconfigures the live EditorView (no remount, no scroll/caret
// loss), and keystrokes never re-theme.
export const EDITOR_THEME_LIGHT: readonly Extension[] = [
  lightContainer,
  syntaxHighlighting(lightHighlight),
];

export const EDITOR_THEME_DARK: readonly Extension[] = [
  darkContainer,
  syntaxHighlighting(darkHighlight),
];

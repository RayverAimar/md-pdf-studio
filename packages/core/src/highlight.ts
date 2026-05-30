import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import bash from "@shikijs/langs/bash";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import python from "@shikijs/langs/python";
import typescript from "@shikijs/langs/typescript";
import {
  createCssVariablesTheme,
  createHighlighterCoreSync,
  type HighlighterCore,
} from "shiki/core";
import { CssClass } from "./constants";

const THEME_NAME = "mdp";

// Shiki grammar names for the languages we bundle. `text` is Shiki's built-in passthrough and needs
// no grammar, so it is the safe fallback for anything we don't recognize.
const Language = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  json: "json",
  bash: "bash",
  fallback: "text",
} as const;

// Fence languages people commonly write that the bundled grammars don't register themselves.
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: Language.typescript,
  js: Language.javascript,
  py: Language.python,
  sh: Language.bash,
  shell: Language.bash,
};

// One highlighter and one theme drive both the preview and the PDF, so highlighted code looks
// identical in each. The css-variables theme emits `color: var(--shiki-*)`, making token colors
// controllable through the schema rather than baked into a fixed TextMate theme.
const cssVariablesTheme = createCssVariablesTheme({ name: THEME_NAME });
const bundledLanguages = [typescript, javascript, python, json, bash];

let highlighter: HighlighterCore | null = null;

function getHighlighter(): HighlighterCore {
  if (highlighter === null) {
    highlighter = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine(),
      themes: [cssVariablesTheme],
      langs: bundledLanguages,
    });
  }
  return highlighter;
}

function resolveLanguage(lang: string): string {
  const normalized = lang.trim().toLowerCase();
  if (normalized === "") return Language.fallback;
  const aliased = LANGUAGE_ALIASES[normalized] ?? normalized;
  return getHighlighter().getLoadedLanguages().includes(aliased) ? aliased : Language.fallback;
}

/** Highlight a fenced code block to a full `<pre>` string, tagged with the code-block class. */
export function highlightCode(code: string, lang: string): string {
  return getHighlighter().codeToHtml(code, {
    lang: resolveLanguage(lang),
    theme: THEME_NAME,
    transformers: [
      {
        pre(node) {
          this.addClassToHast(node, CssClass.codeBlock);
        },
      },
    ],
  });
}

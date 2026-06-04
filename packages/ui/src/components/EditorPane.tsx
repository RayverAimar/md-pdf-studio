"use client";

import { markdown } from "@codemirror/lang-markdown";
import { message } from "@md-pdf-studio/core";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useColorSchemeStore } from "../store/colorSchemeStore";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { UiClass } from "../theme/chrome";
import { EDITOR_THEME_DARK, EDITOR_THEME_LIGHT } from "../theme/editorTheme";

// Markdown editing stays on the main thread; only the render pipeline is offloaded to the worker.
export function EditorPane() {
  const value = useDocumentStore((state) => state.markdown);
  const setMarkdown = useDocumentStore((state) => state.setMarkdown);
  const locale = useLocaleStore((state) => state.locale);
  const scheme = useColorSchemeStore((state) => state.scheme);
  const extensions = useMemo(() => [markdown()], []);
  // Both arrays are stable module constants, so selecting one is already referentially stable per
  // scheme; CodeMirror reconfigures the live view (no remount) when this identity flips on toggle.
  const theme = scheme === "dark" ? EDITOR_THEME_DARK : EDITOR_THEME_LIGHT;

  return (
    <section
      className={`${UiClass.pane} ${UiClass.paneEditor}`}
      aria-label={message("editor", locale)}
    >
      <div className={UiClass.paneHead}>{message("editor", locale)}</div>
      <div className={UiClass.paneBody}>
        <div className={UiClass.editorHost}>
          <CodeMirror
            value={value}
            height="100%"
            theme={theme}
            extensions={extensions}
            onChange={setMarkdown}
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          />
        </div>
      </div>
    </section>
  );
}

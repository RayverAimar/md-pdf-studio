"use client";

import { markdown } from "@codemirror/lang-markdown";
import { message } from "@md-pdf-studio/core";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { UiClass } from "../theme/chrome";

// Markdown editing stays on the main thread; only the render pipeline is offloaded to the worker.
export function EditorPane() {
  const value = useDocumentStore((state) => state.markdown);
  const setMarkdown = useDocumentStore((state) => state.setMarkdown);
  const locale = useLocaleStore((state) => state.locale);
  const extensions = useMemo(() => [markdown()], []);

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
            extensions={extensions}
            onChange={setMarkdown}
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          />
        </div>
      </div>
    </section>
  );
}

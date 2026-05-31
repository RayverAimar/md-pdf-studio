"use client";

import { CssClass, ELEMENT_ATTRIBUTE, isElementKey, message } from "@md-pdf-studio/core";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE, ELEMENT_TO_SECTION, PAGE_SIZE_MM } from "../constants";
import { usePreviewPipeline } from "../pipeline/usePreviewPipeline";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { useUiStore } from "../store/uiStore";
import { PREVIEW_FRAME, PREVIEW_FRAME_CSS, UiClass } from "../theme/chrome";

const STYLE_ID = "mdp-style";
const ROOT_ID = "mdp-root";
const PAGE_ID = "mdp-page";

function px(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

// An isolated document so the generated stylesheet — which targets bare `.mdp-*` selectors and `@page`
// — can never leak into the editor chrome, and matches what the PDF renderer assembles. The page frame
// is editor chrome (a viewport simulation of @page) and carries its own style block, kept apart from
// the generated document stylesheet so the WYSIWYG invariant holds.
const SKELETON = `<!doctype html><html><head><meta charset="utf-8"><style id="${PREVIEW_FRAME.styleId}">${PREVIEW_FRAME_CSS}</style><style id="${STYLE_ID}"></style></head><body><div class="${PREVIEW_FRAME.className}" id="${PAGE_ID}"><div class="${CssClass.root}" id="${ROOT_ID}"></div></div></body></html>`;

export function PreviewPane() {
  const markdown = useDocumentStore((state) => state.markdown);
  const theme = useThemeStore((state) => state.theme);
  const locale = useLocaleStore((state) => state.locale);
  const focusSection = useUiStore((state) => state.focusSection);
  const { html, css } = usePreviewPipeline(markdown, theme);

  // Mirror the printed page geometry on the chrome frame. Read straight off theme.values rather than a
  // dedicated subscription: the effect already re-runs on any theme change, and the page.* values are
  // the only inputs it consumes.
  const pageSize = str(theme.values["page.size"], DEFAULT_PAGE_SIZE);
  const marginTop = px(theme.values["page.marginTop"], 20);
  const marginRight = px(theme.values["page.marginRight"], 18);
  const marginBottom = px(theme.values["page.marginBottom"], 20);
  const marginLeft = px(theme.values["page.marginLeft"], 18);
  const pageBackground = str(theme.values["page.background"], "#ffffff");

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Push the latest HTML and CSS into the live frame without reloading it, so scroll position holds.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!ready || doc === null || doc === undefined) return;
    const style = doc.getElementById(STYLE_ID);
    if (style !== null) style.textContent = css;
    const root = doc.getElementById(ROOT_ID);
    if (root !== null) root.innerHTML = html;
  }, [ready, html, css]);

  // Size the simulated sheet from the page.* theme values, in millimetres, so the preview reflects the
  // real page width and margins without forking the document stylesheet.
  useEffect(() => {
    const page = frameRef.current?.contentDocument?.getElementById(PAGE_ID);
    if (!ready || page === null || page === undefined) return;
    const widthMm = PAGE_SIZE_MM[pageSize] ?? PAGE_SIZE_MM[DEFAULT_PAGE_SIZE];
    page.style.width = `${widthMm}mm`;
    page.style.minHeight = "100%";
    page.style.padding = `${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm`;
    page.style.background = pageBackground;
  }, [ready, pageSize, marginTop, marginRight, marginBottom, marginLeft, pageBackground]);

  // Clicking an element jumps the controls panel to the section that styles it.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!ready || doc === null || doc === undefined) return;
    const onClick = (event: Event): void => {
      const target = event.target as Element | null;
      const owner = target?.closest(`[${ELEMENT_ATTRIBUTE}]`) ?? null;
      const key = owner?.getAttribute(ELEMENT_ATTRIBUTE) ?? null;
      const section = key !== null && isElementKey(key) ? ELEMENT_TO_SECTION[key] : undefined;
      if (section !== undefined) focusSection(section);
    };
    doc.addEventListener("click", onClick);
    return () => doc.removeEventListener("click", onClick);
  }, [ready, focusSection]);

  return (
    <section
      className={`${UiClass.pane} ${UiClass.panePreview}`}
      aria-label={message("preview", locale)}
    >
      <div className={UiClass.paneHead}>{message("preview", locale)}</div>
      <div className={UiClass.paneBody}>
        <iframe
          ref={frameRef}
          className={UiClass.previewFrame}
          title={message("preview", locale)}
          srcDoc={SKELETON}
          onLoad={() => setReady(true)}
        />
      </div>
    </section>
  );
}

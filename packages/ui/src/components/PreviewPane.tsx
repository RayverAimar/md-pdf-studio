"use client";

import { CssClass, ELEMENT_ATTRIBUTE, isElementKey, message } from "@md-pdf-studio/core";
import { useEffect, useRef, useState } from "react";
import { ELEMENT_TO_SECTION } from "../constants";
import { previewBands, previewGeometry, previewTocHtml } from "../pipeline/previewChrome";
import { usePreviewPipeline } from "../pipeline/usePreviewPipeline";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { useUiStore } from "../store/uiStore";
import { PREVIEW_FRAME, PREVIEW_FRAME_CSS, UiClass } from "../theme/chrome";

const STYLE_ID = "mdp-style";
const ROOT_ID = "mdp-root";
const PAGE_ID = "mdp-page";
const HEADER_BAND_ID = "mdp-band-header";
const FOOTER_BAND_ID = "mdp-band-footer";

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

// CSS px per millimetre at the 96dpi the preview iframe renders its mm-sized sheet at.
const MM_TO_PX = 96 / 25.4;

// The exact per-heading page and total are resolved by the 2-pass PDF render the live preview never
// runs. So the preview estimates them from layout: it divides each heading's offset (and the whole
// content height) by one page's usable height. It is approximate — a manual page break shifts the real
// pagination — but it turns the TOC's empty page column and the footer's "—" total into honest numbers.
function fillEstimatedPageNumbers(doc: Document, usablePageHeightPx: number): void {
  const root = doc.getElementById(ROOT_ID);
  if (root === null) return;
  const rootTop = root.getBoundingClientRect().top;
  const total = Math.max(1, Math.ceil(root.scrollHeight / usablePageHeightPx));

  for (const entry of root.querySelectorAll(`.${CssClass.tocEntry}`)) {
    const id = (entry.getAttribute("href") ?? "").replace(/^#/, "");
    const heading = id === "" ? null : doc.getElementById(id);
    const pageSpan = entry.querySelector(`.${CssClass.tocPageNumber}`);
    if (heading === null || pageSpan === null) continue;
    const offset = heading.getBoundingClientRect().top - rootTop;
    pageSpan.textContent = String(
      Math.min(total, Math.max(1, Math.floor(offset / usablePageHeightPx) + 1)),
    );
  }

  const totalSpan = doc.getElementById(FOOTER_BAND_ID)?.querySelector(".totalPages") ?? null;
  if (totalSpan !== null) totalSpan.textContent = String(total);
}

// An isolated document so the generated stylesheet — which targets bare `.mdp-*` selectors and `@page`
// — can never leak into the editor chrome, and matches what the PDF renderer assembles. The page frame
// is editor chrome (a viewport simulation of @page) and carries its own style block, kept apart from
// the generated document stylesheet so the WYSIWYG invariant holds. The two band strips are chrome
// containers; their inner markup comes verbatim from buildPrintMeta so they mirror the PDF's bands.
const SKELETON = `<!doctype html><html><head><meta charset="utf-8"><style id="${PREVIEW_FRAME.styleId}">${PREVIEW_FRAME_CSS}</style><style id="${STYLE_ID}"></style></head><body><div class="${PREVIEW_FRAME.className}" id="${PAGE_ID}"><div class="${PREVIEW_FRAME.band} ${PREVIEW_FRAME.bandHeader}" id="${HEADER_BAND_ID}"></div><div class="${CssClass.root}" id="${ROOT_ID}"></div><div class="${PREVIEW_FRAME.band} ${PREVIEW_FRAME.bandFooter}" id="${FOOTER_BAND_ID}"></div></div></body></html>`;

export function PreviewPane() {
  const markdown = useDocumentStore((state) => state.markdown);
  const theme = useThemeStore((state) => state.theme);
  const locale = useLocaleStore((state) => state.locale);
  const selectElement = useUiStore((state) => state.selectElement);
  const { html, css, headings } = usePreviewPipeline(markdown, theme);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Push the latest CSS and content into the live frame without reloading it, so scroll position holds.
  // The TOC nav is prepended to the body exactly as the PDF does (buildTocHtml output is the leading
  // content), so it is styled by composeDocumentCss's .mdp-toc-* rules — real document content, not
  // chrome. A rAF defers the estimated page numbers until after this paint (and after the sibling
  // geometry effect has set the footer band) so the layout it measures is the final one.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!ready || doc === null || doc === undefined) return;
    const style = doc.getElementById(STYLE_ID);
    if (style !== null) style.textContent = css;
    const root = doc.getElementById(ROOT_ID);
    if (root !== null) root.innerHTML = previewTocHtml(theme, headings, locale) + html;
    const geom = previewGeometry(theme, locale);
    const usablePx = Math.max(
      1,
      (geom.heightMm - geom.margin.topMm - geom.margin.bottomMm) * MM_TO_PX,
    );
    const raf = requestAnimationFrame(() => fillEstimatedPageNumbers(doc, usablePx));
    return () => cancelAnimationFrame(raf);
  }, [ready, html, css, headings, theme, locale]);

  // Frame the content with the SAME geometry the PDF uses: the shared pageGeometry returns the sheet's
  // physical width and the effective margins (base page.margin* plus the header/footer band reserve),
  // so a content line wraps and positions identically in the preview and the PDF.
  //
  // The preview is a single continuous sheet (min-height:100%), not paginated: it does not fragment
  // content into physical pages, repeat the band per page, or visually honor cross-page break controls
  // (pagination.* still emit into composeDocumentCss and affect the PDF). True fragmentation would need a
  // layout/measuring pass (content height vs geom.heightMm minus margins).
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    const page = doc?.getElementById(PAGE_ID);
    if (!ready || page === null || page === undefined || doc === null || doc === undefined) return;

    const geom = previewGeometry(theme, locale);
    const m = geom.margin;
    const pageBackground = str(theme.values["page.background"], "#ffffff");

    page.style.width = `${geom.widthMm}mm`;
    page.style.minHeight = "100%";
    page.style.padding = `${m.topMm}mm ${m.rightMm}mm ${m.bottomMm}mm ${m.leftMm}mm`;
    page.style.background = pageBackground;

    const bands = previewBands(theme, locale);
    const header = doc.getElementById(HEADER_BAND_ID);
    const footer = doc.getElementById(FOOTER_BAND_ID);

    // The strip sits in the reserve region adjacent to the content, full width, so the band's own
    // `padding: 0 12mm` aligns it from the page edge exactly as Chromium prints the template. Setting
    // height to 0 collapses an inactive band so it leaves no visible gap.
    if (header !== null) {
      header.innerHTML = bands.header?.html ?? "";
      header.style.top = `${m.topMm - geom.reserve.topMm}mm`;
      header.style.height = `${geom.reserve.topMm}mm`;
    }
    if (footer !== null) {
      footer.innerHTML = bands.footer?.html ?? "";
      footer.style.bottom = `${m.bottomMm - geom.reserve.bottomMm}mm`;
      footer.style.height = `${geom.reserve.bottomMm}mm`;
    }
  }, [ready, theme, locale]);

  // Clicking an element jumps the rail to the section that styles it and records the element so the
  // inspector can announce the selection to assistive tech.
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!ready || doc === null || doc === undefined) return;
    const onClick = (event: Event): void => {
      const target = event.target as Element | null;
      const owner = target?.closest(`[${ELEMENT_ATTRIBUTE}]`) ?? null;
      const key = owner?.getAttribute(ELEMENT_ATTRIBUTE) ?? null;
      if (key === null || !isElementKey(key)) return;
      const section = ELEMENT_TO_SECTION[key];
      if (section !== undefined) selectElement(section, key);
    };
    doc.addEventListener("click", onClick);
    return () => doc.removeEventListener("click", onClick);
  }, [ready, selectElement]);

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

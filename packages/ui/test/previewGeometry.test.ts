import { composeDocumentCss, defaultPreset, Locale, type Theme } from "@md-pdf-studio/core";
import { prepareContent } from "@md-pdf-studio/render/document";
import { pageGeometry, pageWidthMm } from "@md-pdf-studio/render/pageGeometry";
import { describe, expect, it } from "vitest";
import { PAGE_SIZE_MM } from "../src/constants";
import { previewBands, previewGeometry, previewTocHtml } from "../src/pipeline/previewChrome";
import { runPipeline } from "../src/pipeline/runPipeline";

function themeWith(values: Theme["values"]): Theme {
  return { schemaVersion: 2, name: "My Report", values };
}

describe("preview geometry parity", () => {
  it("the preview frame uses the exact shared pageGeometry", () => {
    const cases: Theme[] = [
      defaultPreset,
      themeWith({ "header.show": true, "header.left": "title", "footer.show": false }),
      themeWith({ "page.size": "Letter", "footer.show": true }),
    ];
    for (const theme of cases) {
      expect(previewGeometry(theme, Locale.english)).toEqual(pageGeometry(theme, Locale.english));
    }
  });

  it("the preview never forks the document stylesheet", () => {
    const theme = themeWith({ "body.color": "#123456" });
    expect(runPipeline({ markdown: "# Heading\n\ntext", theme }).css).toBe(
      composeDocumentCss(theme),
    );
  });

  it("sources the page width map from the render geometry module", () => {
    expect(PAGE_SIZE_MM.A4).toBe(pageWidthMm("A4"));
    expect(PAGE_SIZE_MM.Letter).toBe(pageWidthMm("Letter"));
    expect(PAGE_SIZE_MM.Legal).toBe(pageWidthMm("Legal"));
  });
});

describe("preview band chrome mirrors the PDF", () => {
  it("renders the footer band by default and resolves the live page token", () => {
    const bands = previewBands(defaultPreset, Locale.english);
    expect(bands.header).toBeNull();
    expect(bands.footer).not.toBeNull();
    // The page word comes from buildPrintMeta verbatim; the print token gets a single-sheet value.
    expect(bands.footer?.html).toContain("Page");
    expect(bands.footer?.html).toContain('<span class="pageNumber">1</span>');
    // The print-only @font-face is stripped — the preview iframe already has Inter.
    expect(bands.footer?.html).not.toContain("@font-face");
  });

  it("localizes the band exactly like the PDF", () => {
    const bands = previewBands(defaultPreset, Locale.spanish);
    expect(bands.footer?.html).toContain("Página");
  });

  it("omits a band whose content is none", () => {
    const bands = previewBands(
      themeWith({
        "footer.show": true,
        "footer.left": "none",
        "footer.center": "none",
        "footer.right": "none",
      }),
      Locale.english,
    );
    expect(bands.footer).toBeNull();
  });
});

describe("preview TOC chrome", () => {
  // The preview extracts headings from sanitized HTML (prepareContent is the same source the PDF
  // engine uses); the live component runs the equivalent sanitize on the main thread before extracting.
  // The preview cannot run the 2-pass PDF render, so TOC entries carry blank page slots; relied upon
  // here and locked by document.test.ts ("leaves the page number blank when unknown").
  it("builds entries with blank page numbers", () => {
    const { headings } = prepareContent("# Intro\n\n## Details");
    const toc = previewTocHtml(defaultPreset, headings, Locale.english);
    expect(toc).toContain("Intro");
    expect(toc).toContain('class="mdp-toc-page"></span>');
  });

  it("omits the TOC when disabled, exactly like the PDF engine", () => {
    const { headings } = prepareContent("# Intro");
    const toc = previewTocHtml(themeWith({ "toc.enabled": false }), headings, Locale.english);
    expect(toc).toBe("");
  });
});

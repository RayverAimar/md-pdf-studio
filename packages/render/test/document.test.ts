import { defaultPreset } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import {
  buildDocument,
  buildTocHtml,
  extractHeadings,
  type Heading,
  prepareContent,
} from "@/document";

describe("extractHeadings", () => {
  it("reads id, level and text in document order", () => {
    const html =
      '<h1 class="mdp-h1" id="intro">Intro</h1>' +
      '<h2 class="mdp-h2" id="setup">Set <em>up</em></h2>';
    expect(extractHeadings(html)).toEqual([
      { id: "intro", level: 1, text: "Intro" },
      { id: "setup", level: 2, text: "Set up" },
    ]);
  });

  it("ignores headings without an id", () => {
    expect(extractHeadings("<h1>no id</h1>")).toEqual([]);
  });
});

describe("prepareContent", () => {
  it("sanitizes the body and collects headings", () => {
    const { contentHtml, headings } = prepareContent(
      "# Title\n\n<script>alert(1)</script>\n\n## Part",
    );
    expect(contentHtml).not.toContain("<script>");
    expect(contentHtml).toContain('class="mdp-toc-anchors"');
    expect(headings.map((h) => h.id)).toEqual(["title", "part"]);
  });
});

describe("buildTocHtml", () => {
  const headings: Heading[] = [
    { id: "a", level: 1, text: "Alpha" },
    { id: "b", level: 2, text: "Beta" },
    { id: "c", level: 4, text: "Deep" },
  ];

  it("renders entries with resolved page numbers and respects the depth cap", () => {
    const html = buildTocHtml(headings, { a: 1, b: 3 });
    expect(html).toContain('href="#a"');
    expect(html).toContain(">Alpha<");
    expect(html).toContain(">3<"); // Beta's page
    expect(html).not.toContain("Deep"); // level 4 exceeds default max level 3
  });

  it("leaves the page number blank when unknown", () => {
    const html = buildTocHtml([{ id: "a", level: 1, text: "Alpha" }], {});
    expect(html).toContain('class="mdp-toc-page"></span>');
  });

  it("returns empty string when there are no visible headings", () => {
    expect(buildTocHtml([], {})).toBe("");
  });

  it("emits nothing when disabled even with visible headings", () => {
    expect(buildTocHtml(headings, { a: 1 }, { enabled: false })).toBe("");
  });

  it("honors a custom depth cap", () => {
    const html = buildTocHtml(headings, {}, { maxLevel: 4 });
    expect(html).toContain("Deep"); // level 4 now within the cap
  });

  it("renders the localized title when provided", () => {
    const html = buildTocHtml(headings, {}, { title: "Contents" });
    expect(html).toContain('class="mdp-toc-title">Contents</h2>');
  });

  it("omits the title heading when the title is empty", () => {
    const html = buildTocHtml(headings, {}, { title: "" });
    expect(html).not.toContain("mdp-toc-title");
  });

  it("inserts a leader span between label and page for each entry", () => {
    const html = buildTocHtml([{ id: "a", level: 1, text: "Alpha" }], { a: 2 });
    expect(html).toContain('class="mdp-toc-leader"></span>');
  });
});

describe("buildDocument", () => {
  it("wraps content in the mdp root with the generated stylesheet", () => {
    const doc = buildDocument(defaultPreset, "<p>hi</p>");
    expect(doc.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(doc).toContain("<style>");
    expect(doc).toContain("@page {");
    expect(doc).toContain('<div class="mdp"><p>hi</p></div>');
  });

  it("embeds the bundled @font-face faces so the PDF is self-contained", () => {
    const doc = buildDocument(defaultPreset, "<p>hi</p>");
    expect(doc).toContain("@font-face");
    expect(doc).toContain("font-family:'Inter'");
    expect(doc).toContain("font-family:'JetBrains Mono'");
    expect(doc).toContain("data:font/woff2;base64,");
  });
});

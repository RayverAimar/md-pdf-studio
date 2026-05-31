import { describe, expect, it } from "vitest";
import {
  applyTransforms,
  BASE_CSS,
  composeDocumentCss,
  controlLabel,
  extractHeadingIds,
  FONT_FACE_CSS,
  FontStack,
  generateCss,
  hasSpanishControlLabel,
  highlightCode,
  Locale,
  PresetId,
  presets,
  renderMarkdown,
  SCHEMA_VERSION,
  Section,
  sanitizeHtml,
  schema,
  sectionLabel,
} from "@/index";
import type { Theme } from "@/types";

const editorial = presets[PresetId.editorial];

function emptyTheme(values: Record<string, string | number | boolean> = {}): Theme {
  return { schemaVersion: SCHEMA_VERSION, name: "test", values };
}

describe("generateCss — golden + layering", () => {
  const css = generateCss(schema, editorial);

  it("matches the golden snapshot for the Editorial preset", () => {
    expect(css).toMatchSnapshot();
  });

  it("emits layers in order: @page → :root → element rules", () => {
    const atPage = css.indexOf("@page {");
    const root = css.indexOf(":root {");
    const firstRule = css.indexOf(".mdp");
    expect(atPage).toBeGreaterThanOrEqual(0);
    expect(root).toBeGreaterThan(atPage);
    expect(firstRule).toBeGreaterThan(root);
  });

  it("aggregates page declarations into one @page block", () => {
    expect(css).toContain("size: A4;");
    expect(css).toContain("margin-top: 22mm;");
    expect(css.match(/@page \{/g)).toHaveLength(1);
  });

  it("routes syntax + table colors through :root css variables", () => {
    expect(css).toContain("--shiki-token-keyword: #c792ea;");
    expect(css).toContain("--mdp-table-border: #cbd5e1;");
    expect(css.match(/:root \{/g)).toHaveLength(1);
  });

  it("emits prop rules with units and the multiRule for the chosen border mode", () => {
    expect(css).toContain(".mdp-h1 { font-size: 30pt; }");
    expect(css).toContain(
      ".mdp-table tr { border-bottom: var(--mdp-table-border-width) solid var(--mdp-table-border); }",
    );
  });

  it("includes a boolean rule only when its toggle is on", () => {
    expect(css).toContain(".mdp-table tbody tr:nth-child(even)"); // stripe: true in preset
    expect(css).not.toContain("border-bottom: 1px solid"); // h1.borderBottom default false
  });

  it("emits the wrap rule by default so long code lines stay on the page", () => {
    expect(css).toContain(".mdp-codeblock, .mdp-codeblock code { white-space: pre-wrap;");
  });
});

describe("generateCss — bounded values (structural safety)", () => {
  it("clamps out-of-range numbers to the control's max", () => {
    const css = generateCss(schema, emptyTheme({ "body.fontSize": 999 }));
    expect(css).toContain(".mdp { font-size: 18pt; }");
  });

  it("falls back to default on an invalid hex color", () => {
    const css = generateCss(schema, emptyTheme({ "body.color": "red; } body { color: evil" }));
    expect(css).toContain(".mdp { color: #1a1a1a; }");
  });

  it("falls back to default on an out-of-enum value", () => {
    const css = generateCss(schema, emptyTheme({ "page.size": "A3" }));
    expect(css).toContain("size: A4;");
  });

  it("bounds fontFamily to the bundled stacks, never emitting an injected value", () => {
    const malicious = "serif } .mdp { background: url(http://evil/x) } .mdp";
    const css = generateCss(schema, emptyTheme({ "body.fontFamily": malicious }));
    expect(css).not.toContain(malicious);
    expect(css).not.toContain("url(http://evil/x)");
    const bodyDefault = schema.controls["body.fontFamily"]?.default;
    expect(css).toContain(`.mdp { font-family: ${String(bodyDefault)}; }`);
  });

  it("accepts a bundled font stack as a valid fontFamily value", () => {
    const css = generateCss(schema, emptyTheme({ "body.fontFamily": FontStack.serif }));
    expect(css).toContain(`.mdp { font-family: ${FontStack.serif}; }`);
  });
});

describe("composeDocumentCss — shared layer order", () => {
  const doc = composeDocumentCss(editorial);

  it("assembles font-faces, then base, then the generated theme rules", () => {
    const fonts = doc.indexOf(FONT_FACE_CSS);
    const base = doc.indexOf(BASE_CSS);
    const generated = doc.indexOf(generateCss(schema, editorial));
    expect(fonts).toBe(0);
    expect(base).toBeGreaterThan(fonts);
    expect(generated).toBeGreaterThan(base);
  });
});

describe("renderMarkdown — classes, ids, data-mdp-el", () => {
  it("adds single-class + data-mdp-el + slug id to headings", () => {
    const html = renderMarkdown("# Hello World");
    expect(html).toContain('class="mdp-h1"');
    expect(html).toContain('data-mdp-el="h1"');
    expect(html).toContain('id="hello-world"');
  });

  it("classes inline code", () => {
    expect(renderMarkdown("`x`")).toContain('<code class="mdp-code-inline">x</code>');
  });

  it("de-duplicates repeated heading slugs", () => {
    const html = renderMarkdown("## Intro\n\ntext\n\n## Intro");
    expect(html).toContain('id="intro"');
    expect(html).toContain('id="intro-2"');
  });
});

describe("renderMarkdown — footnotes, task lists, figures", () => {
  it("renders footnotes as .mdp-footnotes with a descendant separator hr", () => {
    const html = renderMarkdown("Here[^1] is a note.\n\n[^1]: the note body");
    const section = html.match(/<section class="[^"]*mdp-footnotes[^"]*">([\s\S]*?)<\/section>/);
    expect(section).not.toBeNull();
    expect(section?.[1]).toContain("<hr");
    expect(html).toContain("mdp-fnref");
  });

  it("renders task list items with a checkbox inside each .mdp-li", () => {
    const html = renderMarkdown("- [ ] a\n- [x] b");
    const items = [...html.matchAll(/<li class="[^"]*\bmdp-li\b[^"]*"[^>]*>(.*?)<\/li/g)];
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item[1]).toMatch(/<input[^>]*type="checkbox"/);
    }
  });

  it("wraps a lone image with a title in a figure with a figcaption", () => {
    const html = renderMarkdown('![alt words](pic.png "Caption text")');
    expect(html).toContain('class="mdp-figure"');
    expect(html).toContain('<figcaption class="mdp-figcaption">Caption text</figcaption>');
    expect(html).toContain('class="mdp-img"');
  });

  it("uses the alt text as the caption when no title is given", () => {
    const html = renderMarkdown("![alt words](pic.png)");
    expect(html).toContain('class="mdp-figure"');
    expect(html).toContain('<figcaption class="mdp-figcaption">alt words</figcaption>');
  });

  it("emits the figure without a figcaption when alt and title are both empty", () => {
    const html = renderMarkdown("![](pic.png)");
    expect(html).toContain('class="mdp-figure"');
    expect(html).not.toContain("mdp-figcaption");
  });

  it("leaves an inline image that is not alone in its paragraph as an img", () => {
    const html = renderMarkdown("before ![a](p.png) after");
    expect(html).not.toContain("mdp-figure");
    expect(html).toContain('class="mdp-img"');
  });
});

describe("sanitizeHtml — XSS surface", () => {
  it("drops <script> and event handlers but keeps mdp markup", () => {
    const dirty = '<p class="mdp-p" onclick="steal()">hi</p><script>alert(1)</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain('class="mdp-p"');
  });

  it("strips javascript: URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("keeps data: images (preview parity) but strips data: on links", () => {
    const img = sanitizeHtml('<img class="mdp-img" src="data:image/png;base64,AAAA">');
    expect(img).toContain("data:image/png;base64,AAAA");
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')).not.toContain(
      "data:",
    );
  });
});

describe("highlightCode — single shared highlighter", () => {
  it("emits css-variable token colors and the mdp-codeblock class", () => {
    const html = highlightCode("const x = 1;", "ts");
    expect(html).toContain("var(--shiki-token-keyword)");
    expect(html).toContain("mdp-codeblock");
  });

  it("falls back to plain text for unknown languages without throwing", () => {
    expect(() => highlightCode("whatever", "klingon")).not.toThrow();
  });
});

describe("TOC anchors — heading destinations", () => {
  it("extracts heading ids in order, immune to duplicate text", () => {
    const html = renderMarkdown("# A\n\n## Dup\n\n## Dup");
    expect(extractHeadingIds(html)).toEqual(["a", "dup", "dup-2"]);
  });

  it("appends a hidden anchor nav and forces <details open>", () => {
    const out = applyTransforms(
      renderMarkdown("# Title\n\n<details><summary>s</summary>x</details>"),
    );
    expect(out).toContain('<nav class="mdp-toc-anchors"');
    expect(out).toContain('href="#title"');
    expect(out).toContain("<details open");
  });
});

describe("i18n coverage — every control and section is translated", () => {
  it("has a Spanish label for every control id (so a new untranslated control fails CI)", () => {
    const untranslated = Object.entries(schema.controls).filter(([id, control]) => {
      const spanish = controlLabel(id, control.label, Locale.spanish);
      return spanish === control.label && !hasSpanishControlLabel(id);
    });
    expect(untranslated.map(([id]) => id)).toEqual([]);
  });

  it("has a section label for every SectionId in every locale", () => {
    for (const sectionId of Object.values(Section)) {
      expect(sectionLabel(sectionId, Locale.english)).not.toBe("");
      expect(sectionLabel(sectionId, Locale.spanish)).not.toBe("");
    }
  });
});

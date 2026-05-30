import { describe, expect, it } from "vitest";
import editorialPreset from "../../../presets/editorial.json";
import {
  applyTransforms,
  extractHeadingIds,
  generateCss,
  highlightCode,
  renderMarkdown,
  sanitizeHtml,
  schema,
} from "../src/index";
import type { Theme } from "../src/types";

const editorial = editorialPreset as unknown as Theme;

function emptyTheme(values: Record<string, string | number | boolean> = {}): Theme {
  return { schemaVersion: 1, name: "test", values };
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
    expect(css).toContain(".mdp-table tr { border-bottom: 1px solid var(--mdp-table-border); }");
  });

  it("includes a boolean rule only when its toggle is on", () => {
    expect(css).toContain(".mdp-table tbody tr:nth-child(even)"); // stripe: true in preset
    expect(css).not.toContain("white-space: pre-wrap"); // codeBlock.wrap default false
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

import { Locale, schema, type Theme } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { buildPrintMeta } from "@/headerFooter";

function themeWith(values: Theme["values"]): Theme {
  return { schemaVersion: 2, name: "My Report", values };
}

describe("buildPrintMeta", () => {
  it("disables header/footer entirely when both are off", () => {
    const meta = buildPrintMeta(themeWith({ "header.show": false, "footer.show": false }));
    expect(meta.displayHeaderFooter).toBe(false);
  });

  it("renders the page footer with the localized word and Chromium token", () => {
    const meta = buildPrintMeta(
      themeWith({ "footer.show": true, "footer.content": "page" }),
      Locale.spanish,
    );
    expect(meta.displayHeaderFooter).toBe(true);
    expect(meta.footerTemplate).toContain("Página");
    expect(meta.footerTemplate).toContain('class="pageNumber"');
  });

  it("renders page-total with both Chromium tokens", () => {
    const meta = buildPrintMeta(themeWith({ "footer.show": true, "footer.content": "page-total" }));
    expect(meta.footerTemplate).toContain('class="pageNumber"');
    expect(meta.footerTemplate).toContain('class="totalPages"');
  });

  it("escapes the theme name used as the header title", () => {
    const theme: Theme = {
      schemaVersion: 2,
      name: "A & B <x>",
      values: { "header.show": true, "header.content": "title" },
    };
    const meta = buildPrintMeta(theme);
    expect(meta.headerTemplate).toContain("A &amp; B &lt;x&gt;");
  });

  it("reserves extra margin on the edge that carries a band", () => {
    const meta = buildPrintMeta(
      themeWith({
        "header.show": true,
        "header.content": "title",
        "footer.show": false,
        "page.marginTop": 20,
        "page.marginBottom": 20,
      }),
    );
    expect(meta.marginTopMm).toBeGreaterThan(20);
    expect(meta.marginBottomMm).toBe(20);
  });

  it("applies the header/footer font size and color inline", () => {
    const meta = buildPrintMeta(
      themeWith({
        "footer.show": true,
        "footer.content": "page",
        "headerFooter.fontSize": 11,
        "headerFooter.color": "#123456",
      }),
    );
    expect(meta.footerTemplate).toContain("font-size: 11pt");
    expect(meta.footerTemplate).toContain("color: #123456");
  });

  it("falls back to the schema default for a non-hex color and never injects it", () => {
    const malicious = 'red" onload="steal()';
    const meta = buildPrintMeta(
      themeWith({
        "footer.show": true,
        "footer.content": "page",
        "headerFooter.color": malicious,
      }),
    );
    const fallback = schema.controls["headerFooter.color"]?.default;
    expect(meta.footerTemplate).toContain(`color: ${String(fallback)}`);
    expect(meta.footerTemplate).not.toContain(malicious);
    expect(meta.footerTemplate).not.toContain("onload");
    expect(meta.footerTemplate).not.toContain('color: red"');
  });

  it("clamps the font size to the schema range", () => {
    const max = schema.controls["headerFooter.fontSize"]?.max ?? 14;
    const meta = buildPrintMeta(
      themeWith({
        "footer.show": true,
        "footer.content": "page",
        "headerFooter.fontSize": 999,
      }),
    );
    expect(meta.footerTemplate).toContain(`font-size: ${String(max)}pt`);
    expect(meta.footerTemplate).not.toContain("999pt");
  });

  it("inlines an @font-face for Inter so the band font resolves in the print context", () => {
    const meta = buildPrintMeta(themeWith({ "footer.show": true, "footer.content": "page" }));
    expect(meta.footerTemplate).toContain("@font-face");
    expect(meta.footerTemplate).toContain("font-family:'Inter'");
  });
});

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

  it("disables a band when all of its slots are none", () => {
    const meta = buildPrintMeta(
      themeWith({
        "footer.show": true,
        "footer.left": "none",
        "footer.center": "none",
        "footer.right": "none",
      }),
    );
    expect(meta.displayHeaderFooter).toBe(false);
  });

  it("renders a page-number slot with the localized word and Chromium token", () => {
    const meta = buildPrintMeta(
      themeWith({ "footer.show": true, "footer.center": "page" }),
      Locale.spanish,
    );
    expect(meta.displayHeaderFooter).toBe(true);
    expect(meta.footerTemplate).toContain("Página");
    expect(meta.footerTemplate).toContain('class="pageNumber"');
  });

  it("renders a page-total slot with both Chromium tokens", () => {
    const meta = buildPrintMeta(themeWith({ "footer.show": true, "footer.center": "page-total" }));
    expect(meta.footerTemplate).toContain('class="pageNumber"');
    expect(meta.footerTemplate).toContain('class="totalPages"');
  });

  it("lays the three slots out left / center / right via space-between", () => {
    const meta = buildPrintMeta(
      themeWith({ "footer.show": true, "footer.left": "title", "footer.right": "page" }),
    );
    expect(meta.footerTemplate).toContain("justify-content: space-between");
    // left slot (title) and right slot (page) both present, center empty.
    expect(meta.footerTemplate).toContain("My Report");
    expect(meta.footerTemplate).toContain('class="pageNumber"');
  });

  it("prints nothing for a crafted or unrecognized slot value", () => {
    const meta = buildPrintMeta(
      themeWith({ "footer.show": true, "footer.center": '"><script>steal()</script>' }),
    );
    // The crafted token isn't one of the known shapes, so the slot renders empty — no injection.
    expect(meta.footerTemplate).not.toContain("steal()");
    expect(meta.footerTemplate).not.toContain("<script>");
  });

  it("escapes the theme name used as a title slot", () => {
    const theme: Theme = {
      schemaVersion: 2,
      name: "A & B <x>",
      values: { "header.show": true, "header.left": "title" },
    };
    const meta = buildPrintMeta(theme);
    expect(meta.headerTemplate).toContain("A &amp; B &lt;x&gt;");
  });

  it("reserves extra margin on the edge that carries a band", () => {
    const meta = buildPrintMeta(
      themeWith({
        "header.show": true,
        "header.left": "title",
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
        "footer.center": "page",
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
        "footer.center": "page",
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
      themeWith({ "footer.show": true, "footer.center": "page", "headerFooter.fontSize": 999 }),
    );
    expect(meta.footerTemplate).toContain(`font-size: ${String(max)}pt`);
    expect(meta.footerTemplate).not.toContain("999pt");
  });

  it("inlines an @font-face for Inter so the band font resolves in the print context", () => {
    const meta = buildPrintMeta(themeWith({ "footer.show": true, "footer.center": "page" }));
    expect(meta.footerTemplate).toContain("@font-face");
    expect(meta.footerTemplate).toContain("font-family:'Inter'");
  });
});

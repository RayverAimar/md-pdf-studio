import { schema, type Theme } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { buildPrintMeta } from "@/headerFooter";
import { pageGeometry, TEMPLATE_RESERVE_MM } from "@/pageGeometry";

function themeWith(values: Theme["values"]): Theme {
  return { schemaVersion: 2, name: "My Report", values };
}

const baseTopDefault = schema.controls["page.marginTop"]?.default as number;
const baseBottomDefault = schema.controls["page.marginBottom"]?.default as number;

describe("pageGeometry", () => {
  it("reserves the band on the top edge when a header is active", () => {
    const geom = pageGeometry(
      themeWith({ "header.show": true, "header.left": "title", "page.marginTop": 20 }),
    );
    expect(geom.headerActive).toBe(true);
    expect(geom.reserve.topMm).toBe(TEMPLATE_RESERVE_MM);
    expect(geom.margin.topMm).toBe(20 + TEMPLATE_RESERVE_MM);
  });

  it("reserves the footer band by default", () => {
    const geom = pageGeometry(themeWith({}));
    expect(geom.footerActive).toBe(true);
    expect(geom.headerActive).toBe(false);
    expect(geom.margin.bottomMm).toBe(baseBottomDefault + TEMPLATE_RESERVE_MM);
    expect(geom.margin.topMm).toBe(baseTopDefault);
  });

  it("reserves nothing when the band content is none", () => {
    const geom = pageGeometry(
      themeWith({
        "header.show": true,
        "header.left": "none",
        "header.center": "none",
        "header.right": "none",
        "page.marginTop": 20,
      }),
    );
    expect(geom.headerActive).toBe(false);
    expect(geom.reserve.topMm).toBe(0);
    expect(geom.margin.topMm).toBe(20);
  });

  it("reserves nothing for an out-of-enum content value (meta controls skip validation)", () => {
    // A crafted/legacy theme can carry a content value the UI never emits; it produces no band, so it
    // must reserve no margin — matching buildPrintMeta, whose body is empty for unrecognized content.
    const theme = themeWith({
      "footer.show": true,
      "footer.center": "bogus",
      "page.marginBottom": 20,
    });
    const geom = pageGeometry(theme);
    expect(geom.footerActive).toBe(false);
    expect(geom.reserve.bottomMm).toBe(0);
    expect(geom.margin.bottomMm).toBe(20);
    expect(buildPrintMeta(theme).marginBottomMm).toBe(20);
  });

  it("tracks the physical sheet dimensions for the page size", () => {
    expect(pageGeometry(themeWith({ "page.size": "Letter" })).pageSize).toBe("Letter");
    expect(pageGeometry(themeWith({ "page.size": "Letter" })).widthMm).toBe(215.9);
    expect(pageGeometry(themeWith({ "page.size": "A4" })).widthMm).toBe(210);
    expect(pageGeometry(themeWith({ "page.size": "Legal" })).heightMm).toBe(355.6);
  });

  it("falls back to the default page size for an unknown value", () => {
    const geom = pageGeometry(themeWith({ "page.size": "Tabloid" }));
    expect(geom.pageSize).toBe("A4");
    expect(geom.widthMm).toBe(210);
  });
});

// The single most important guard: if anyone re-introduces an independent reserve in either the
// preview or the PDF path, these effective margins drift apart and this lock fails.
describe("pageGeometry / buildPrintMeta margin parity", () => {
  const cases: Array<{ name: string; values: Theme["values"] }> = [
    { name: "header off, footer off", values: { "header.show": false, "footer.show": false } },
    {
      name: "header on, footer off",
      values: { "header.show": true, "header.left": "title", "footer.show": false },
    },
    { name: "header off, footer on", values: { "header.show": false, "footer.show": true } },
    {
      name: "header on, footer on",
      values: { "header.show": true, "header.left": "title", "footer.show": true },
    },
  ];

  for (const { name, values } of cases) {
    it(`effective margins equal the print meta margins (${name})`, () => {
      const theme = themeWith({ "page.marginTop": 22, "page.marginBottom": 19, ...values });
      const geom = pageGeometry(theme);
      const meta = buildPrintMeta(theme);
      expect(geom.margin.topMm).toBe(meta.marginTopMm);
      expect(geom.margin.rightMm).toBe(meta.marginRightMm);
      expect(geom.margin.bottomMm).toBe(meta.marginBottomMm);
      expect(geom.margin.leftMm).toBe(meta.marginLeftMm);
    });
  }
});

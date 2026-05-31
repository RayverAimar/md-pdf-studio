import { ElementKey, schema } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { ELEMENT_TO_SECTION, SECTION_ORDER } from "../src/constants";

describe("controls panel grouping", () => {
  it("orders every section a schema control belongs to, with no orphans", () => {
    const order = new Set<string>(SECTION_ORDER);
    const used = new Set(Object.values(schema.controls).map((control) => control.section));
    for (const section of used) expect(order.has(section)).toBe(true);
    for (const section of SECTION_ORDER) expect(used.has(section)).toBe(true);
  });

  it("maps every heading element to a real section", () => {
    const order = new Set<string>(SECTION_ORDER);
    const headings = [
      ElementKey.heading1,
      ElementKey.heading2,
      ElementKey.heading3,
      ElementKey.heading4,
      ElementKey.heading5,
      ElementKey.heading6,
    ];
    for (const key of headings) {
      const section = ELEMENT_TO_SECTION[key];
      expect(section).toBeDefined();
      expect(order.has(section as string)).toBe(true);
    }
  });

  it("only ever points elements at sections the panel renders", () => {
    const order = new Set<string>(SECTION_ORDER);
    for (const section of Object.values(ELEMENT_TO_SECTION)) {
      if (section !== undefined) expect(order.has(section)).toBe(true);
    }
  });
});

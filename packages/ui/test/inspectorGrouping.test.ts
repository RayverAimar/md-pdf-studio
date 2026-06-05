import type { ControlDef } from "@md-pdf-studio/core";
import { schema } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import {
  type Entry,
  facetOf,
  groupByPrefix,
  sectionLayout,
} from "../src/components/inspectorGrouping";
import { SECTION_ORDER } from "../src/constants";

// Only the tuple shape matters to groupByPrefix; the ControlDef value is opaque to it.
const stub = {} as ControlDef;
const entry = (id: string): [string, ControlDef] => [id, stub];

const entriesFor = (section: string): Entry[] =>
  Object.entries(schema.controls).filter(([, c]) => c.section === section) as Entry[];

const ctl = (id: string): ControlDef => schema.controls[id] as ControlDef;

describe("groupByPrefix", () => {
  it("splits a section into one group per id prefix, preserving first-seen order", () => {
    const groups = groupByPrefix([
      entry("h1.fontSize"),
      entry("h1.color"),
      entry("h2.fontSize"),
      entry("h2.color"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["h1", "h2"]);
    expect(groups[0]?.entries.map(([id]) => id)).toEqual(["h1.fontSize", "h1.color"]);
    expect(groups[1]?.entries.map(([id]) => id)).toEqual(["h2.fontSize", "h2.color"]);
  });

  it("collapses a single-prefix section to one group", () => {
    const groups = groupByPrefix([entry("page.size"), entry("page.marginTop")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("page");
  });

  it("falls back to the whole id when there is no dot", () => {
    expect(groupByPrefix([entry("standalone")])[0]?.key).toBe("standalone");
  });

  it("returns an empty list for no entries", () => {
    expect(groupByPrefix([])).toEqual([]);
  });
});

describe("facetOf", () => {
  it("routes every color control to the color facet, including border/background colors", () => {
    for (const id of ["table.headerBg", "table.borderColor", "blockquote.background"]) {
      expect(facetOf(id, ctl(id))).toBe("color");
    }
  });

  it("keeps font-weight in typography, not border (rule order)", () => {
    expect(facetOf("table.headerWeight", ctl("table.headerWeight"))).toBe("typography");
  });

  it("buckets the box model into spacing and border", () => {
    expect(facetOf("table.cellPaddingX", ctl("table.cellPaddingX"))).toBe("spacing");
    expect(facetOf("table.borderWidth", ctl("table.borderWidth"))).toBe("border");
    expect(facetOf("codeBlock.borderRadius", ctl("codeBlock.borderRadius"))).toBe("border");
  });

  it("falls back to behavior for toggles and leftover enums", () => {
    expect(facetOf("table.stripe", ctl("table.stripe"))).toBe("behavior");
    expect(facetOf("codeBlock.wrap", ctl("codeBlock.wrap"))).toBe("behavior");
  });
});

describe("sectionLayout", () => {
  it("renders a dense single-prefix section as ordered property facets", () => {
    const layout = sectionLayout(entriesFor("tables"));
    expect(layout.kind).toBe("facet");
    expect(layout.groups.map((g) => g.key)).toEqual([
      "typography",
      "color",
      "spacing",
      "border",
      "behavior",
    ]);
  });

  it("renders an all-color section as a swatch grid", () => {
    expect(sectionLayout(entriesFor("code-colors")).kind).toBe("swatchGrid");
  });

  it("renders headings as collapsible prefix (level) groups", () => {
    const layout = sectionLayout(entriesFor("headings"));
    expect(layout.kind).toBe("prefix");
    expect(layout.collapsible).toBe(true);
    expect(layout.groups.map((g) => g.key)).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
  });

  it("renders a small multi-prefix section as static prefix groups", () => {
    const layout = sectionLayout(entriesFor("emphasis"));
    expect(layout.kind).toBe("prefix");
    expect(layout.collapsible).toBe(false);
    expect(layout.groups.map((g) => g.key)).toEqual(["strong", "em"]);
  });

  it("renders a small single-prefix section flat", () => {
    expect(sectionLayout(entriesFor("links")).kind).toBe("flat");
    expect(sectionLayout(entriesFor("page")).kind).toBe("flat");
  });

  // A future schema addition that mis-buckets surfaces here: every section keeps all of its controls.
  it("never drops a control in any section layout", () => {
    for (const sectionId of SECTION_ORDER) {
      const entries = entriesFor(sectionId);
      const grouped = sectionLayout(entries).groups.reduce((sum, g) => sum + g.entries.length, 0);
      expect(grouped).toBe(entries.length);
    }
  });
});

import type { ControlDef } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { groupByPrefix } from "../src/components/Ribbon";

// Only the tuple shape matters to groupByPrefix; the ControlDef value is opaque to it.
const stub = {} as ControlDef;
const entry = (id: string): [string, ControlDef] => [id, stub];

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
    const groups = groupByPrefix([entry("standalone")]);
    expect(groups[0]?.key).toBe("standalone");
  });

  it("returns an empty list for no entries", () => {
    expect(groupByPrefix([])).toEqual([]);
  });
});

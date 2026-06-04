import type { ControlDef } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { controlHint } from "../src/components/controls/controlHint";

// Minimal ControlDef factory: only the fields controlHint reads matter; the rest satisfy the type.
function def(partial: Partial<ControlDef> & Pick<ControlDef, "control">): ControlDef {
  return {
    type: "dimension",
    emitter: "prop",
    default: 0,
    section: "page",
    label: "ignored",
    ...partial,
  } as ControlDef;
}

describe("controlHint", () => {
  it("appends the range and unit for a bounded slider", () => {
    const control = def({ control: "slider", min: 0, max: 60, unit: "mm" });
    expect(controlHint(control, "page.marginTop", "Margin top", "en")).toBe(
      "Margin top — 0 to 60 mm",
    );
  });

  it("localizes the range connector and omits a missing unit", () => {
    const control = def({ control: "number", min: 1, max: 2 });
    expect(controlHint(control, "body.lineHeight", "Interlineado", "es")).toBe(
      "Interlineado — 1 a 2",
    );
  });

  it("covers steppers the same way as sliders", () => {
    const control = def({ control: "stepper", min: 1, max: 6 });
    expect(controlHint(control, "toc.depth", "Depth", "en")).toBe("Depth — 1 to 6");
  });

  it("lists the localized option set for an enum", () => {
    const control = def({
      control: "segmented",
      type: "enum",
      enum: ["all", "horizontal", "none"],
    });
    expect(controlHint(control, "table.borderMode", "Borders", "en")).toBe(
      "Borders — All, Horizontal, None",
    );
    expect(controlHint(control, "table.borderMode", "Bordes", "es")).toBe(
      "Bordes — Todos, Horizontales, Ninguno",
    );
  });

  it("falls back to the bare label for font families (proper-noun list)", () => {
    const control = def({ control: "select", type: "fontFamily" });
    expect(controlHint(control, "body.fontFamily", "Typeface", "en")).toBe("Typeface");
  });

  it("falls back to the bare label for color and toggle controls", () => {
    expect(controlHint(def({ control: "color" }), "page.background", "Background", "en")).toBe(
      "Background",
    );
    expect(controlHint(def({ control: "toggle" }), "toc.enabled", "Show TOC", "en")).toBe(
      "Show TOC",
    );
  });

  it("returns just the label when a numeric control has no bounds", () => {
    const control = def({ control: "number" });
    expect(controlHint(control, "x.y", "Unbounded", "en")).toBe("Unbounded");
  });
});

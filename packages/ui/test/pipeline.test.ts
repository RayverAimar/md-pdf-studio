import { CssClass, defaultPreset, type Theme } from "@md-pdf-studio/core";
import { describe, expect, it } from "vitest";
import { runPipeline } from "../src/pipeline/runPipeline";

describe("runPipeline", () => {
  it("renders Markdown to HTML carrying the mdp element classes", () => {
    const { rawHtml } = runPipeline({ markdown: "# Title", theme: defaultPreset });
    expect(rawHtml).toContain(`class="${CssClass.heading1}"`);
    expect(rawHtml).toContain("Title");
  });

  it("emits the same layered stylesheet the PDF uses", () => {
    const { css } = runPipeline({ markdown: "text", theme: defaultPreset });
    expect(css).toContain("@page");
    expect(css).toContain(`.${CssClass.heading1}`);
  });

  it("embeds the bundled @font-face faces so the preview matches the PDF", () => {
    const { css } = runPipeline({ markdown: "text", theme: defaultPreset });
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family:'Inter'");
    expect(css).toContain("font-family:'JetBrains Mono'");
    expect(css).toContain("data:font/woff2;base64,");
  });

  it("reflects a changed control value in the generated CSS", () => {
    const theme: Theme = {
      ...defaultPreset,
      values: { ...defaultPreset.values, "body.color": "#123456" },
    };
    expect(runPipeline({ markdown: "x", theme }).css).toContain("#123456");
  });
});

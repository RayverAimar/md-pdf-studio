import type { RenderInput, Theme } from "@md-pdf-studio/core";
import { defaultPreset } from "@md-pdf-studio/core";
import { describe, expect, it, vi } from "vitest";
import type { HeadingPages } from "@/document";
import type { RenderHtmlToPdf } from "@/twoPassToc";
import { renderDocumentWithToc } from "@/twoPassToc";

const decoder = new TextDecoder();

function inputFrom(markdown: string, themeOverrides: Partial<Theme["values"]> = {}): RenderInput {
  return {
    markdown,
    theme: { ...defaultPreset, values: { ...defaultPreset.values, ...themeOverrides } },
  };
}

/** Records every HTML it is asked to render and returns the HTML as bytes so tests can inspect it. */
function recordingRenderer(): {
  renderHtmlToPdf: RenderHtmlToPdf;
  htmlOf: (call: number) => string;
  calls: () => number;
} {
  const rendered: string[] = [];
  return {
    renderHtmlToPdf: (html) => {
      rendered.push(html);
      return Promise.resolve(new TextEncoder().encode(html));
    },
    htmlOf: (call) => rendered[call] ?? "",
    calls: () => rendered.length,
  };
}

describe("renderDocumentWithToc", () => {
  it("re-renders until the page mapping is stable, then stops", async () => {
    const renderer = recordingRenderer();
    const readPages = vi.fn<(pdf: Uint8Array, ids: string[]) => Promise<HeadingPages>>(() =>
      Promise.resolve({ title: 2 }),
    );

    await renderDocumentWithToc(inputFrom("# Title\n\nbody"), {
      renderHtmlToPdf: renderer.renderHtmlToPdf,
      readHeadingPages: readPages,
    });

    // Pass 1 finds {title:2} (changed from {}), pass 2 confirms it is unchanged → 2 renders total.
    expect(renderer.calls()).toBe(2);
    expect(renderer.htmlOf(0)).toContain('class="mdp-toc-page"></span>'); // page unknown on first pass
    expect(renderer.htmlOf(1)).toContain(">2</span>"); // resolved page shown on second pass
  });

  it("renders once and never reads pages when there are no headings", async () => {
    const renderer = recordingRenderer();
    const readPages = vi.fn<(pdf: Uint8Array, ids: string[]) => Promise<HeadingPages>>(() =>
      Promise.resolve({}),
    );

    const pdf = await renderDocumentWithToc(inputFrom("just a paragraph"), {
      renderHtmlToPdf: renderer.renderHtmlToPdf,
      readHeadingPages: readPages,
    });

    expect(renderer.calls()).toBe(1);
    expect(readPages).not.toHaveBeenCalled();
    expect(decoder.decode(pdf)).toContain('<div class="mdp">');
  });

  it("stops at maxPasses when the page mapping never settles", async () => {
    const renderer = recordingRenderer();
    let tick = 0;
    const readPages = vi.fn<(pdf: Uint8Array, ids: string[]) => Promise<HeadingPages>>(() => {
      tick += 1;
      return Promise.resolve({ title: tick });
    });

    await renderDocumentWithToc(
      inputFrom("# Title\n\nbody"),
      { renderHtmlToPdf: renderer.renderHtmlToPdf, readHeadingPages: readPages },
      { maxPasses: 3 },
    );

    expect(renderer.calls()).toBe(3);
  });

  it("renders a single pass and never reads pages when the TOC is disabled", async () => {
    const renderer = recordingRenderer();
    const readPages = vi.fn<(pdf: Uint8Array, ids: string[]) => Promise<HeadingPages>>(() =>
      Promise.resolve({ title: 2 }),
    );

    await renderDocumentWithToc(inputFrom("# Title\n\nbody", { "toc.enabled": false }), {
      renderHtmlToPdf: renderer.renderHtmlToPdf,
      readHeadingPages: readPages,
    });

    expect(renderer.calls()).toBe(1);
    expect(readPages).not.toHaveBeenCalled();
    expect(renderer.htmlOf(0)).not.toContain('<nav class="mdp-toc">');
  });

  it("respects the configured TOC depth", async () => {
    const renderer = recordingRenderer();
    await renderDocumentWithToc(inputFrom("# One\n\n## Two\n\n### Three", { "toc.depth": 1 }), {
      renderHtmlToPdf: renderer.renderHtmlToPdf,
      readHeadingPages: () => Promise.resolve({ one: 1 }),
    });
    const nav = renderer.htmlOf(0).match(/<nav class="mdp-toc">[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(nav).toContain(">One<");
    expect(nav).not.toContain(">Two<");
  });
});

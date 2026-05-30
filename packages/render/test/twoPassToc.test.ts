import type { RenderInput } from "@md-pdf-studio/core";
import { defaultPreset } from "@md-pdf-studio/core";
import { describe, expect, it, vi } from "vitest";
import type { HeadingPages } from "@/document";
import { renderDocumentWithToc } from "@/twoPassToc";

const decoder = new TextDecoder();

function inputFrom(markdown: string): RenderInput {
  return { markdown, theme: defaultPreset };
}

/** Records every HTML it is asked to render and returns the HTML as bytes so tests can inspect it. */
function recordingRenderer(): {
  renderHtmlToPdf: (html: string) => Promise<Uint8Array>;
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
});

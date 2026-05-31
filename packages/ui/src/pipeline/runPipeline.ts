import { composeDocumentCss, renderMarkdown, type Theme } from "@md-pdf-studio/core";

export interface PipelineInput {
  markdown: string;
  theme: Theme;
}

export interface PipelineOutput {
  /** Unsanitized HTML; the caller sanitizes on the main thread where the DOM is available. */
  rawHtml: string;
  /** The exact stylesheet the PDF uses, so the preview is WYSIWYG. */
  css: string;
}

/**
 * Pure transform from document + theme to render-ready HTML and CSS, free of any DOM dependency so it
 * runs identically on the main thread or in a worker. Highlighting (Shiki) happens inside
 * renderMarkdown, keeping the preview's syntax colors identical to the PDF's.
 */
export function runPipeline(input: PipelineInput): PipelineOutput {
  return {
    rawHtml: renderMarkdown(input.markdown),
    css: composeDocumentCss(input.theme),
  };
}

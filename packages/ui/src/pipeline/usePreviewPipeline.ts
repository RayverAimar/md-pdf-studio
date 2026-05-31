"use client";

import type { Theme } from "@md-pdf-studio/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { type PipelineInput, type PipelineOutput, runPipeline } from "./runPipeline";
import { sanitizeForPreview } from "./sanitizeClient";

export interface PreviewState {
  html: string;
  css: string;
}

// Keystrokes coalesce within this window before a render runs, so fast typing produces one render.
const DEBOUNCE_MS = 120;

function createWorker(): Worker | null {
  try {
    return new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

/**
 * Drive the live preview from the document and theme. Heavy work (parse, highlight, CSS) runs in a
 * worker when one can be created, and falls back to the main thread otherwise, so the preview is
 * always correct even where worker bundling is unavailable.
 */
export function usePreviewPipeline(markdown: string, theme: Theme): PreviewState {
  const [state, setState] = useState<PreviewState>({ html: "", css: "" });
  const workerRef = useRef<Worker | null>(null);
  const brokenRef = useRef(false);
  const latestInput = useRef<PipelineInput>({ markdown, theme });

  const apply = useCallback((output: PipelineOutput): void => {
    setState({ html: sanitizeForPreview(output.rawHtml), css: output.css });
  }, []);

  useEffect(() => {
    const worker = createWorker();
    workerRef.current = worker;
    if (worker !== null) {
      worker.onmessage = (event: MessageEvent<PipelineOutput>) => apply(event.data);
      worker.onerror = () => {
        // The worker is unusable; recompute the latest input inline and stay on that path.
        brokenRef.current = true;
        apply(runPipeline(latestInput.current));
      };
    }
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, [apply]);

  useEffect(() => {
    const input: PipelineInput = { markdown, theme };
    latestInput.current = input;
    const timer = setTimeout(() => {
      const worker = workerRef.current;
      if (worker !== null && !brokenRef.current) worker.postMessage(input);
      else apply(runPipeline(input));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [markdown, theme, apply]);

  return state;
}

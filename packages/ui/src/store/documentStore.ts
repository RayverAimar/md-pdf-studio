import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistedStorage, StorageKey } from "./persistence";
import { SAMPLE_DOCUMENT } from "./sampleDocument";

interface DocumentState {
  markdown: string;
  setMarkdown: (markdown: string) => void;
  loadMarkdown: (markdown: string) => void;
  newDocument: () => void;
}

/** The Markdown source. Edited on the main thread (CodeMirror), read by the render pipeline. */
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      markdown: SAMPLE_DOCUMENT,
      setMarkdown: (markdown) => set({ markdown }),
      loadMarkdown: (markdown) => set({ markdown }),
      newDocument: () => set({ markdown: "" }),
    }),
    { name: StorageKey.document, storage: persistedStorage, skipHydration: true },
  ),
);

import type { SectionId } from "@md-pdf-studio/core";
import { create } from "zustand";

interface UiState {
  /** Section the controls panel should reveal, set by clicking an element in the preview. */
  focusedSection: SectionId | null;
  /** Bumped on every focus so re-clicking the same section still re-triggers the reveal. */
  focusToken: number;
  focusSection: (section: SectionId) => void;
}

/** Ephemeral editor UI state (not persisted): which section the preview asked the panel to reveal. */
export const useUiStore = create<UiState>((set) => ({
  focusedSection: null,
  focusToken: 0,
  focusSection: (section) =>
    set((state) => ({ focusedSection: section, focusToken: state.focusToken + 1 })),
}));

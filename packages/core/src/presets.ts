import editorial from "./presets/editorial.json";
import minimal from "./presets/minimal.json";
import technical from "./presets/technical.json";
import type { Theme } from "./types";

/** Canonical preset identities. A new preset is one entry here plus its JSON file. */
export const PresetId = {
  editorial: "editorial",
  technical: "technical",
  minimal: "minimal",
} as const;
export type PresetId = (typeof PresetId)[keyof typeof PresetId];

export const presets: Record<PresetId, Theme> = {
  [PresetId.editorial]: editorial as unknown as Theme,
  [PresetId.technical]: technical as unknown as Theme,
  [PresetId.minimal]: minimal as unknown as Theme,
};

/** The preset a fresh document starts from — never a blank canvas. */
export const defaultPresetId: PresetId = PresetId.editorial;
export const defaultPreset: Theme = presets[defaultPresetId];

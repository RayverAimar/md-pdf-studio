import {
  defaultPresetId,
  migrateTheme,
  type PresetId,
  presets,
  schema,
  type Theme,
  type ThemeValue,
} from "@md-pdf-studio/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistedStorage, StorageKey } from "./persistence";

interface ThemeState {
  presetId: PresetId;
  theme: Theme;
  /** True once the user changes a control away from the active preset. */
  dirty: boolean;
  setValue: (id: string, value: ThemeValue) => void;
  selectPreset: (presetId: PresetId) => void;
  reset: () => void;
  exportTheme: () => Theme;
  importTheme: (json: unknown) => boolean;
}

/** Shape-check a parsed JSON object before it is allowed to drive rendering. */
function isTheme(value: unknown): value is Theme {
  if (typeof value !== "object" || value === null) return false;
  const { schemaVersion, name, values } = value as Record<string, unknown>;
  return (
    typeof schemaVersion === "number" &&
    typeof name === "string" &&
    typeof values === "object" &&
    values !== null
  );
}

/** The style theme driving both the preview and the PDF. Values are the schema control id → value map. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      presetId: defaultPresetId,
      theme: presets[defaultPresetId],
      dirty: false,
      setValue: (id, value) =>
        set((state) => ({
          theme: { ...state.theme, values: { ...state.theme.values, [id]: value } },
          dirty: true,
        })),
      selectPreset: (presetId) => set({ presetId, theme: presets[presetId], dirty: false }),
      reset: () => set((state) => ({ theme: presets[state.presetId], dirty: false })),
      exportTheme: () => ({ ...get().theme }),
      importTheme: (json) => {
        if (!isTheme(json)) return false;
        // An imported theme stands apart from any preset; flag it dirty and bring it forward so a
        // file authored against an older schema still renders against the current controls.
        set({ theme: migrateTheme(json, schema), dirty: true });
        return true;
      },
    }),
    {
      name: StorageKey.theme,
      storage: persistedStorage,
      skipHydration: true,
      // A persisted theme may predate the current schema; bring it forward before it drives rendering.
      onRehydrateStorage: () => (state) => {
        if (state?.theme !== undefined) state.theme = migrateTheme(state.theme, schema);
      },
    },
  ),
);

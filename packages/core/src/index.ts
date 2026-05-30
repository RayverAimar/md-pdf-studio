export { BASE_CSS } from "./base";
export {
  CssClass,
  CssVar,
  cssVarRef,
  ELEMENT_ATTRIBUTE,
  ElementKey,
  FontStack,
  Palette,
  Section,
  type SectionId,
  Selector,
  ShikiVar,
} from "./constants";
export { generateCss } from "./generateCss";
export { highlightCode } from "./highlight";
export {
  controlLabel,
  DEFAULT_LOCALE,
  isLocale,
  Locale,
  type Localized,
  type MessageKey,
  Messages,
  message,
  presetLabel,
  resolveLocale,
  SUPPORTED_LOCALES,
  sectionLabel,
  translate,
} from "./i18n";
export { renderMarkdown } from "./markdown";
export { migrateTheme } from "./migrations";
export { defaultPreset, defaultPresetId, PresetId, presets } from "./presets";
export { ALLOWED_ATTR, ALLOWED_TAGS, sanitizeHtml } from "./sanitize";
export { SCHEMA_VERSION, schema } from "./schema";
export { applyTransforms, extractHeadingIds } from "./transforms";
export * from "./types";

export { BASE_CSS } from "./base";
export {
  CssClass,
  CssVar,
  cssVarRef,
  ELEMENT_ATTRIBUTE,
  ElementKey,
  FontStack,
  isElementKey,
  Palette,
  Section,
  type SectionId,
  Selector,
  ShikiVar,
} from "./constants";
export { FONT_FACE_CSS } from "./fonts";
export { composeDocumentCss, generateCss, HEX_RE, isHexColor } from "./generateCss";
export { highlightCode } from "./highlight";
export {
  controlLabel,
  DEFAULT_LOCALE,
  hasSpanishControlLabel,
  isLocale,
  Locale,
  type Localized,
  type MessageKey,
  message,
  optionLabel,
  presetLabel,
  resolveLocale,
  SUPPORTED_LOCALES,
  sectionLabel,
} from "./i18n";
export { renderMarkdown } from "./markdown";
export { migrateTheme } from "./migrations";
export { defaultPreset, defaultPresetId, isPresetId, PresetId, presets } from "./presets";
export { ALLOWED_ATTR, ALLOWED_TAGS, sanitizeHtml } from "./sanitize";
export { SCHEMA_VERSION, schema } from "./schema";
export { slug } from "./slug";
export { applyTransforms, extractHeadingIds } from "./transforms";
export * from "./types";

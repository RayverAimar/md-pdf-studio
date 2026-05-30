import { Section, type SectionId } from "./constants";
import { PresetId } from "./presets";

export const Locale = {
  english: "en",
  spanish: "es",
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];

export const DEFAULT_LOCALE: Locale = Locale.english;
export const SUPPORTED_LOCALES: readonly Locale[] = [Locale.english, Locale.spanish];

/** A string translated into every supported locale. */
export type Localized = Record<Locale, string>;

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Coerce a stored preference or a `navigator.language` tag (e.g. "es-PE") to a supported locale. */
export function resolveLocale(value: string | null | undefined): Locale {
  if (value === null || value === undefined) return DEFAULT_LOCALE;
  const base = value.toLowerCase().split("-")[0] ?? "";
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

/** Read the value of a localized string for a locale. */
export function translate(localized: Localized, locale: Locale): string {
  return localized[locale];
}

// Chrome strings (app shell, buttons). Components read these through `message()`; the UI owns the
// current locale and passes it in.
export const Messages = {
  appName: { en: "md-pdf-studio", es: "md-pdf-studio" },
  exportPdf: { en: "Export PDF", es: "Exportar PDF" },
  generating: { en: "Generating…", es: "Generando…" },
  language: { en: "Language", es: "Idioma" },
  resetAll: { en: "Reset all", es: "Restablecer todo" },
  search: { en: "Search", es: "Buscar" },
} satisfies Record<string, Localized>;

export type MessageKey = keyof typeof Messages;

export function message(key: MessageKey, locale: Locale): string {
  return Messages[key][locale];
}

const SECTION_LABELS: Record<SectionId, Localized> = {
  [Section.page]: { en: "Page", es: "Página" },
  [Section.body]: { en: "Body", es: "Cuerpo" },
  [Section.headings]: { en: "Headings", es: "Encabezados" },
  [Section.links]: { en: "Links", es: "Enlaces" },
  [Section.codeInline]: { en: "Code · inline", es: "Código · en línea" },
  [Section.codeBlock]: { en: "Code · block", es: "Código · bloque" },
  [Section.codeColors]: { en: "Code · colors", es: "Código · colores" },
  [Section.tables]: { en: "Tables", es: "Tablas" },
  [Section.blockquote]: { en: "Blockquote", es: "Cita" },
};

export function sectionLabel(sectionId: SectionId, locale: Locale): string {
  return SECTION_LABELS[sectionId][locale];
}

const PRESET_LABELS: Record<PresetId, Localized> = {
  [PresetId.editorial]: { en: "Editorial", es: "Editorial" },
  [PresetId.technical]: { en: "Technical", es: "Técnico" },
  [PresetId.minimal]: { en: "Minimal", es: "Mínimo" },
};

export function presetLabel(presetId: PresetId, locale: Locale): string {
  return PRESET_LABELS[presetId][locale];
}

function headingLabelsEs(prefix: string, heading: string): Record<string, string> {
  return {
    [`${prefix}.fontSize`]: `Tamaño ${heading}`,
    [`${prefix}.fontWeight`]: `Grosor ${heading}`,
    [`${prefix}.color`]: `Color ${heading}`,
    [`${prefix}.marginTop`]: `Espacio arriba ${heading}`,
    [`${prefix}.marginBottom`]: `Espacio abajo ${heading}`,
  };
}

// Spanish control labels, keyed by control id. The English label lives on the control (schema `label`)
// and is used as the fallback, so an untranslated control still renders rather than showing a key.
const CONTROL_LABELS_ES: Record<string, string> = {
  "page.size": "Tamaño de página",
  "page.marginTop": "Margen superior",
  "page.marginRight": "Margen derecho",
  "page.marginBottom": "Margen inferior",
  "page.marginLeft": "Margen izquierdo",
  "page.background": "Fondo",
  "body.fontFamily": "Tipografía",
  "body.fontSize": "Tamaño de fuente",
  "body.color": "Color de texto",
  "body.lineHeight": "Interlineado",
  ...headingLabelsEs("h1", "H1"),
  ...headingLabelsEs("h2", "H2"),
  ...headingLabelsEs("h3", "H3"),
  "link.color": "Color de enlace",
  "link.textDecoration": "Decoración",
  "link.fontWeight": "Grosor",
  "codeInline.fontFamily": "Tipografía",
  "codeInline.fontSize": "Tamaño de fuente",
  "codeInline.color": "Color de texto",
  "codeInline.background": "Fondo",
  "codeBlock.fontSize": "Tamaño de fuente",
  "codeBlock.background": "Fondo",
  "codeBlock.padding": "Relleno",
  "codeBlock.borderRadius": "Radio de esquina",
  "codeBlock.lineHeight": "Interlineado",
  "codeBlock.wrap": "Ajustar líneas largas",
  "syntax.foreground": "Texto",
  "syntax.comment": "Comentario",
  "syntax.keyword": "Palabra clave",
  "syntax.string": "Cadena",
  "syntax.number": "Número / constante",
  "syntax.function": "Función",
  "table.headerBg": "Fondo de encabezado",
  "table.headerColor": "Texto de encabezado",
  "table.borderColor": "Color de borde",
  "table.borderMode": "Bordes",
  "table.cellPaddingX": "Relleno horizontal de celda",
  "table.cellPaddingY": "Relleno vertical de celda",
  "table.stripe": "Filas alternadas",
  "table.stripeColor": "Color de fila alterna",
  "blockquote.borderLeftWidth": "Ancho de barra",
  "blockquote.borderLeftColor": "Color de barra",
  "blockquote.color": "Color de texto",
  "blockquote.fontStyle": "Estilo",
  "blockquote.paddingLeft": "Sangría",
};

/** Localized label for a control. Falls back to the control's English label when untranslated. */
export function controlLabel(controlId: string, englishLabel: string, locale: Locale): string {
  if (locale === Locale.spanish) return CONTROL_LABELS_ES[controlId] ?? englishLabel;
  return englishLabel;
}

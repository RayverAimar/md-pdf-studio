import { Section, type SectionId } from "./constants";
import { PresetId } from "./presets";
import { HEADING_CONTROL_SUFFIXES, type HeadingControlSuffix } from "./schema";

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

// Chrome strings (app shell, buttons). Components read these through `message()`; the UI owns the
// current locale and passes it in.
const Messages = {
  appName: { en: "md-pdf-studio", es: "md-pdf-studio" },
  logoLabel: { en: "md-pdf-studio logo", es: "logo de md-pdf-studio" },
  exportPdf: { en: "Export PDF", es: "Exportar PDF" },
  generating: { en: "Generating…", es: "Generando…" },
  language: { en: "Language", es: "Idioma" },
  increment: { en: "Increase", es: "Aumentar" },
  decrement: { en: "Decrease", es: "Disminuir" },
  resetAll: { en: "Reset all", es: "Restablecer todo" },
  search: { en: "Search", es: "Buscar" },
  preset: { en: "Preset", es: "Preajuste" },
  controls: { en: "Controls", es: "Controles" },
  editor: { en: "Editor", es: "Editor" },
  preview: { en: "Preview", es: "Vista previa" },
  exportFailed: { en: "Could not export the PDF", es: "No se pudo exportar el PDF" },
  noResults: { en: "No matching controls", es: "Sin controles que coincidan" },
  document: { en: "Document", es: "Documento" },
  importMarkdown: { en: "Import Markdown", es: "Importar Markdown" },
  newDocument: { en: "New document", es: "Nuevo documento" },
  confirmNewDocument: {
    en: "Discard the current document?",
    es: "¿Descartar el documento actual?",
  },
  exportTheme: { en: "Export theme", es: "Exportar tema" },
  importTheme: { en: "Import theme", es: "Importar tema" },
  importThemeFailed: { en: "Could not import the theme", es: "No se pudo importar el tema" },
  themeJson: { en: "Theme JSON", es: "JSON del tema" },
  themeJsonTitle: { en: "Theme JSON", es: "JSON del tema" },
  themeJsonView: { en: "Current theme", es: "Tema actual" },
  themeJsonPaste: { en: "Paste theme JSON", es: "Pegar JSON del tema" },
  themeJsonImport: { en: "Import pasted JSON", es: "Importar JSON pegado" },
  themeJsonCopy: { en: "Copy", es: "Copiar" },
  themeJsonCopied: { en: "Theme JSON copied", es: "JSON del tema copiado" },
  themeJsonCopyFailed: { en: "Could not copy", es: "No se pudo copiar" },
  themeJsonInvalidSyntax: { en: "Not valid JSON", es: "JSON no válido" },
  themeJsonInvalidShape: { en: "Not a valid theme", es: "No es un tema válido" },
  themeJsonClose: { en: "Close", es: "Cerrar" },
  dismissNotification: { en: "Dismiss notification", es: "Descartar notificación" },
  themeImported: { en: "Theme imported", es: "Tema importado" },
  themeExported: { en: "Theme exported", es: "Tema exportado" },
  markdownImported: { en: "Document imported", es: "Documento importado" },
  markdownImportFailed: {
    en: "Could not import the document",
    es: "No se pudo importar el documento",
  },
  pdfExported: { en: "PDF exported", es: "PDF exportado" },
  tocTitleContents: { en: "Contents", es: "Contenido" },
  tocTitleIndex: { en: "Index", es: "Índice" },
  footerPage: { en: "Page", es: "Página" },
  switchToDark: { en: "Switch to dark theme", es: "Cambiar a tema oscuro" },
  switchToLight: { en: "Switch to light theme", es: "Cambiar a tema claro" },
  collapseRibbon: { en: "Collapse ribbon", es: "Contraer cinta" },
  expandRibbon: { en: "Expand ribbon", es: "Expandir cinta" },
  rangeTo: { en: "to", es: "a" },
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
  [Section.emphasis]: { en: "Emphasis", es: "Énfasis" },
  [Section.lists]: { en: "Lists", es: "Listas" },
  [Section.tables]: { en: "Tables", es: "Tablas" },
  [Section.blockquote]: { en: "Blockquote", es: "Cita" },
  [Section.horizontalRule]: { en: "Horizontal rule", es: "Línea horizontal" },
  [Section.images]: { en: "Images", es: "Imágenes" },
  [Section.footnotes]: { en: "Footnotes", es: "Notas al pie" },
  [Section.toc]: { en: "Table of contents", es: "Tabla de contenido" },
  [Section.pagination]: { en: "Pagination", es: "Paginación" },
  [Section.headerFooter]: { en: "Header & footer", es: "Encabezado y pie" },
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

// Spanish label template per suffix; keyed by the shared suffix type so a new suffix forces a label.
const HEADING_SUFFIX_LABELS_ES: Record<HeadingControlSuffix, (heading: string) => string> = {
  fontSize: (h) => `Tamaño ${h}`,
  fontWeight: (h) => `Grosor ${h}`,
  color: (h) => `Color ${h}`,
  marginTop: (h) => `Espacio arriba ${h}`,
  marginBottom: (h) => `Espacio abajo ${h}`,
  lineHeight: (h) => `Interlineado ${h}`,
  borderBottom: (h) => `Línea inferior ${h}`,
  borderBottomColor: (h) => `Color de línea ${h}`,
  breakBefore: (h) => `Salto de página antes de ${h}`,
};

function headingLabelsEs(prefix: string, heading: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const suffix of HEADING_CONTROL_SUFFIXES)
    out[`${prefix}.${suffix}`] = HEADING_SUFFIX_LABELS_ES[suffix](heading);
  return out;
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
  "body.textAlign": "Alineación",
  "body.paragraphSpacing": "Espacio entre párrafos",
  ...headingLabelsEs("h1", "H1"),
  ...headingLabelsEs("h2", "H2"),
  ...headingLabelsEs("h3", "H3"),
  ...headingLabelsEs("h4", "H4"),
  ...headingLabelsEs("h5", "H5"),
  ...headingLabelsEs("h6", "H6"),
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
  "blockquote.background": "Fondo",
  "blockquote.marginY": "Espacio vertical",
  "blockquote.nestedIndent": "Sangría anidada",
  "strong.fontWeight": "Grosor de negrita",
  "strong.color": "Color de negrita",
  "em.fontStyle": "Estilo de cursiva",
  "em.color": "Color de cursiva",
  "codeInline.padding": "Relleno",
  "codeInline.borderRadius": "Radio de esquina",
  "codeInline.border": "Color de borde",
  "codeBlock.fontFamily": "Tipografía",
  "codeBlock.borderColor": "Color de borde",
  "syntax.variable": "Variable",
  "syntax.punctuation": "Puntuación",
  "table.headerWeight": "Grosor de encabezado",
  "table.borderWidth": "Ancho de borde",
  "table.fontSize": "Tamaño de fuente",
  "table.headerAlign": "Alineación de encabezado",
  "table.cellAlign": "Alineación de celda",
  "list.bulletStyle": "Estilo de viñeta",
  "list.numberStyle": "Estilo de numeración",
  "list.indent": "Sangría",
  "list.itemSpacing": "Espacio entre ítems",
  "list.nestedIndent": "Sangría anidada",
  "list.markerColor": "Color de marcador",
  "taskList.checkboxStyle": "Estilo de casilla",
  "hr.thickness": "Grosor",
  "hr.color": "Color",
  "hr.style": "Estilo",
  "hr.marginY": "Espacio vertical",
  "image.maxWidth": "Ancho máximo",
  "image.align": "Alineación",
  "image.border": "Color de borde",
  "image.borderRadius": "Radio de esquina",
  "image.shadow": "Sombra",
  "caption.fontSize": "Tamaño de leyenda",
  "caption.color": "Color de leyenda",
  "caption.fontStyle": "Estilo de leyenda",
  "footnote.separator": "Separador",
  "footnote.fontSize": "Tamaño de fuente",
  "footnote.color": "Color de texto",
  "toc.enabled": "Mostrar tabla de contenido",
  "toc.depth": "Profundidad",
  "toc.title": "Título",
  "toc.leaderDots": "Puntos guía",
  "toc.fontSize": "Tamaño de fuente",
  "toc.indentPerLevel": "Sangría por nivel",
  "pagination.widows": "Viudas",
  "pagination.orphans": "Huérfanas",
  "pagination.keepHeadings": "No cortar tras encabezados",
  "pagination.breakBeforeH1": "Salto de página antes de H1",
  "header.show": "Mostrar encabezado",
  "header.content": "Contenido de encabezado",
  "footer.show": "Mostrar pie",
  "footer.content": "Contenido de pie",
  "headerFooter.fontSize": "Tamaño de fuente",
  "headerFooter.color": "Color de texto",
};

/** Localized label for a control. Falls back to the control's English label when untranslated. */
export function controlLabel(controlId: string, englishLabel: string, locale: Locale): string {
  if (locale === Locale.spanish) return CONTROL_LABELS_ES[controlId] ?? englishLabel;
  return englishLabel;
}

/** Whether a Spanish control label is defined for an id (some legitimately match the English word). */
export function hasSpanishControlLabel(controlId: string): boolean {
  return controlId in CONTROL_LABELS_ES;
}

// Display labels for the options of an enum control, keyed by `controlId` then by option value. Only
// semantic enums whose tokens read as English words are listed; language-neutral tokens (A4, decimal,
// dashed, …) are intentionally absent so `optionLabel` falls back to the raw value for them.
const OPTION_LABELS: Record<string, Record<string, Localized>> = {
  "body.textAlign": {
    left: { en: "Left", es: "Izquierda" },
    justify: { en: "Justify", es: "Justificado" },
  },
  "link.textDecoration": {
    none: { en: "None", es: "Ninguna" },
    underline: { en: "Underline", es: "Subrayado" },
  },
  "em.fontStyle": {
    italic: { en: "Italic", es: "Cursiva" },
    normal: { en: "Normal", es: "Normal" },
  },
  "blockquote.fontStyle": {
    normal: { en: "Normal", es: "Normal" },
    italic: { en: "Italic", es: "Cursiva" },
  },
  "caption.fontStyle": {
    italic: { en: "Italic", es: "Cursiva" },
    normal: { en: "Normal", es: "Normal" },
  },
  "table.borderMode": {
    all: { en: "All", es: "Todos" },
    horizontal: { en: "Horizontal", es: "Horizontales" },
    none: { en: "None", es: "Ninguno" },
  },
  "table.headerAlign": {
    left: { en: "Left", es: "Izquierda" },
    center: { en: "Center", es: "Centro" },
    right: { en: "Right", es: "Derecha" },
  },
  "table.cellAlign": {
    left: { en: "Left", es: "Izquierda" },
    center: { en: "Center", es: "Centro" },
    right: { en: "Right", es: "Derecha" },
  },
  "list.bulletStyle": {
    none: { en: "None", es: "Ninguna" },
  },
  "image.align": {
    left: { en: "Left", es: "Izquierda" },
    center: { en: "Center", es: "Centro" },
    right: { en: "Right", es: "Derecha" },
  },
  "footnote.separator": {
    line: { en: "Line", es: "Línea" },
    space: { en: "Space", es: "Espacio" },
    none: { en: "None", es: "Ninguno" },
  },
  "toc.title": {
    contents: { en: "Contents", es: "Contenido" },
    index: { en: "Index", es: "Índice" },
    none: { en: "None", es: "Ninguno" },
  },
  "taskList.checkboxStyle": {
    accent: { en: "Accent", es: "Acento" },
    square: { en: "Square", es: "Cuadrada" },
    hidden: { en: "Hidden", es: "Oculta" },
  },
  "header.content": {
    none: { en: "None", es: "Ninguno" },
    title: { en: "Title", es: "Título" },
    date: { en: "Date", es: "Fecha" },
    "title-date": { en: "Title & date", es: "Título y fecha" },
  },
  "footer.content": {
    none: { en: "None", es: "Ninguno" },
    page: { en: "Page number", es: "Número de página" },
    "page-total": { en: "Page of total", es: "Página de total" },
    "title-page": { en: "Title & page", es: "Título y página" },
  },
};

/**
 * Localized label for an enum option. Falls back to the raw value for language-neutral tokens (page
 * sizes, list-style keywords, line styles, …) that read the same in every locale.
 */
export function optionLabel(controlId: string, value: string | number, locale: Locale): string {
  const key = String(value);
  return OPTION_LABELS[controlId]?.[key]?.[locale] ?? key;
}

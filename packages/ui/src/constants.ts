import {
  ElementKey,
  RailCategory,
  type RailCategoryId,
  Section,
  type SectionId,
} from "@md-pdf-studio/core";
import { pageWidthMm } from "@md-pdf-studio/render/pageGeometry";

// Physical page widths in millimetres, keyed by the `page.size` enum. Derived from the render
// geometry module so the preview frame and the PDF can never disagree on the printed sheet width.
export const PAGE_SIZE_MM: Readonly<Record<string, number>> = {
  A4: pageWidthMm("A4"),
  Letter: pageWidthMm("Letter"),
  Legal: pageWidthMm("Legal"),
};

/** Order sections appear in the controls panel — page-level first, then content, then code, tables, quotes. */
export const SECTION_ORDER: readonly SectionId[] = [
  Section.page,
  Section.body,
  Section.headings,
  Section.links,
  Section.emphasis,
  Section.lists,
  Section.codeInline,
  Section.codeBlock,
  Section.codeColors,
  Section.tables,
  Section.blockquote,
  Section.horizontalRule,
  Section.images,
  Section.footnotes,
  Section.toc,
  Section.pagination,
  Section.headerFooter,
];

// Which rail category band each section sits under. A coarse index over the closed section set — the
// rail's analogue of SECTION_ORDER — so a new control needs no change and a new section needs one line.
export const SECTION_CATEGORY: Record<SectionId, RailCategoryId> = {
  [Section.page]: RailCategory.pageDocument,
  [Section.pagination]: RailCategory.pageDocument,
  [Section.headerFooter]: RailCategory.pageDocument,
  [Section.toc]: RailCategory.pageDocument,
  [Section.footnotes]: RailCategory.pageDocument,
  [Section.body]: RailCategory.text,
  [Section.headings]: RailCategory.text,
  [Section.links]: RailCategory.text,
  [Section.emphasis]: RailCategory.text,
  [Section.lists]: RailCategory.blocks,
  [Section.blockquote]: RailCategory.blocks,
  [Section.horizontalRule]: RailCategory.blocks,
  [Section.images]: RailCategory.blocks,
  [Section.codeInline]: RailCategory.codeTables,
  [Section.codeBlock]: RailCategory.codeTables,
  [Section.codeColors]: RailCategory.codeTables,
  [Section.tables]: RailCategory.codeTables,
};

/** Order the rail's category bands appear in. */
export const CATEGORY_ORDER: readonly RailCategoryId[] = [
  RailCategory.pageDocument,
  RailCategory.text,
  RailCategory.blocks,
  RailCategory.codeTables,
];

// Clicking a rendered element should reveal the section that styles it. Elements without a dedicated
// section are absent, so a click there simply does nothing.
export const ELEMENT_TO_SECTION: Partial<Record<ElementKey, SectionId>> = {
  [ElementKey.heading1]: Section.headings,
  [ElementKey.heading2]: Section.headings,
  [ElementKey.heading3]: Section.headings,
  [ElementKey.heading4]: Section.headings,
  [ElementKey.heading5]: Section.headings,
  [ElementKey.heading6]: Section.headings,
  [ElementKey.body]: Section.body,
  [ElementKey.link]: Section.links,
  [ElementKey.emphasis]: Section.emphasis,
  [ElementKey.list]: Section.lists,
  [ElementKey.blockquote]: Section.blockquote,
  [ElementKey.table]: Section.tables,
  [ElementKey.horizontalRule]: Section.horizontalRule,
  [ElementKey.image]: Section.images,
};

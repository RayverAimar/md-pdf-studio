import { ALLOWED_ATTR, ALLOWED_TAGS } from "@md-pdf-studio/core";
import DOMPurify from "dompurify";

// Preview-side counterpart to the server's sanitize-html, using the same shared allowlist so both
// shells strip exactly the same things. `style` is allowed because Shiki's token colors ride on inline
// `var(--shiki-*)` declarations; inline style cannot execute script in modern engines. URL-scheme policy
// matches the server's ALLOWED_SCHEMES/IMG_ALLOWED_SCHEMES: DOMPurify's default permits `data:` only on
// media tags (img), and blocks javascript:/data: on links, so preview and PDF resolve the same URLs.
const config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: true,
} as const;

/** Strip script-bearing markup from rendered HTML before it is injected into the preview. */
export function sanitizeForPreview(html: string): string {
  return DOMPurify.sanitize(html, config);
}

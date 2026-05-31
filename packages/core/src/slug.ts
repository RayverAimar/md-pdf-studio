const FALLBACK_SLUG = "document";

/** A filesystem-safe, lowercase ASCII slug for download file names, falling back when empty. */
export function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || FALLBACK_SLUG
  );
}

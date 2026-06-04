"use client";

import { type Locale, message } from "@md-pdf-studio/core";
import { BRAND_LOGO_DATA_URI } from "../theme/brandLogo";
import { UiClass } from "../theme/chrome";

// Shared toolbar brand: the product mark (a base64 data URI, so web and desktop render it identically)
// beside the wordmark. The mark is decorative — the adjacent text already announces the app name.
export function Logo({ locale }: { locale: Locale }) {
  return (
    <span className={UiClass.brand}>
      <img className={UiClass.brandMark} src={BRAND_LOGO_DATA_URI} alt="" aria-hidden="true" />
      <span className={UiClass.brandWordmark}>{message("appName", locale)}</span>
    </span>
  );
}

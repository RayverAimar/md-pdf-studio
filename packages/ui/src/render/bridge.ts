import type { DesktopBridge } from "@md-pdf-studio/core";

declare global {
  interface Window {
    mdPdfStudio?: DesktopBridge;
  }
}

/** The desktop bridge if running inside Electron, otherwise undefined (browser shell). */
export function desktopBridge(): DesktopBridge | undefined {
  return typeof window === "undefined" ? undefined : window.mdPdfStudio;
}

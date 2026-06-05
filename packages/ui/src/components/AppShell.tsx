"use client";

import { useColorSchemeStore } from "../store/colorSchemeStore";
import { CHROME_CSS, UiClass } from "../theme/chrome";
import { EditorPane } from "./EditorPane";
import { Inspector } from "./Inspector";
import { PreviewPane } from "./PreviewPane";
import { ToastViewport } from "./ToastViewport";
import { Toolbar } from "./Toolbar";

/** The editor shell: a toolbar over a work area — a left controls dock (section rail + single-scroll
 * inspector) beside the source and live preview, side by side. */
export function AppShell() {
  // Resolved post-hydration in Studio (which gates this render), so reading it here is flash-free.
  // The attribute is the chrome-stylesheet's dark scope selector; toggling it re-resolves --ui-* with
  // no JS recompute and never crosses into the isolated preview iframe.
  const scheme = useColorSchemeStore((s) => s.scheme);
  return (
    <div className={UiClass.shell} data-ui-theme={scheme}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a static, build-time stylesheet string. */}
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS }} />
      <Toolbar />
      <div className={UiClass.workspace}>
        <Inspector />
        <div className={UiClass.grid}>
          <EditorPane />
          <PreviewPane />
        </div>
      </div>
      <ToastViewport />
    </div>
  );
}

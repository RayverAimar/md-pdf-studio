"use client";

import { useColorSchemeStore } from "../store/colorSchemeStore";
import { CHROME_CSS, UiClass } from "../theme/chrome";
import { ControlsPanel } from "./ControlsPanel";
import { EditorPane } from "./EditorPane";
import { PreviewPane } from "./PreviewPane";
import { ToastViewport } from "./ToastViewport";
import { Toolbar } from "./Toolbar";

/** The three-column editor: source on the left, the live preview as the hero, controls on the right. */
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
      <div className={UiClass.grid}>
        <EditorPane />
        <PreviewPane />
        <ControlsPanel />
      </div>
      <ToastViewport />
    </div>
  );
}

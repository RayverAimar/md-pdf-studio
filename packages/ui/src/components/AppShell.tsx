"use client";

import { useColorSchemeStore } from "../store/colorSchemeStore";
import { CHROME_CSS, UiClass } from "../theme/chrome";
import { EditorPane } from "./EditorPane";
import { PreviewPane } from "./PreviewPane";
import { Ribbon } from "./Ribbon";
import { ToastViewport } from "./ToastViewport";
import { Toolbar } from "./Toolbar";

/** The editor shell: a toolbar, a Word-like ribbon of section tabs and controls, then the source and
 * live preview side by side at full width below. */
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
      <Ribbon />
      <div className={UiClass.grid}>
        <EditorPane />
        <PreviewPane />
      </div>
      <ToastViewport />
    </div>
  );
}

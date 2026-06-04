"use client";

import { CHROME_CSS, UiClass } from "../theme/chrome";
import { ControlsPanel } from "./ControlsPanel";
import { EditorPane } from "./EditorPane";
import { PreviewPane } from "./PreviewPane";
import { ToastViewport } from "./ToastViewport";
import { Toolbar } from "./Toolbar";

/** The three-column editor: source on the left, the live preview as the hero, controls on the right. */
export function AppShell() {
  return (
    <div className={UiClass.shell}>
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

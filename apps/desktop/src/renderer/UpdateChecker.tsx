import { type CSSProperties, useEffect, useState } from "react";
import type { UpdaterBridge } from "../ipc";

// The packaged-only updater surface exposed by the preload; absent in the web shell, so this renders null.
function getUpdater(): UpdaterBridge | undefined {
  return (globalThis as { mdPdfStudioUpdater?: UpdaterBridge }).mdPdfStudioUpdater;
}

type Phase = "hidden" | "available" | "downloading" | "downloaded" | "error";

/**
 * In-app update dialog. On launch the main process checks the GitHub release feed; when an update is
 * available this surfaces a dialog with the new version and notes, downloads on the user's request with
 * a live progress bar, and offers a restart to install. A failed check stays silent (offline / no
 * release), matching the unobtrusive auto-update UX.
 */
export function UpdateChecker() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const updater = getUpdater();
    if (updater === undefined) return;
    return updater.onEvent((event) => {
      switch (event.kind) {
        case "available":
          setVersion(event.version);
          setNotes(event.notes);
          setPhase("available");
          break;
        case "progress":
          setPercent(event.percent);
          setPhase("downloading");
          break;
        case "downloaded":
          setVersion(event.version);
          setPhase("downloaded");
          break;
        case "error":
          setError(event.message);
          // A check failing before any update was offered stays silent; a failure mid-flow surfaces.
          setPhase((prev) => (prev === "hidden" ? "hidden" : "error"));
          break;
      }
    });
  }, []);

  if (phase === "hidden") return null;
  const updater = getUpdater();

  return (
    <div style={SCRIM} role="presentation">
      <div style={CARD} role="dialog" aria-modal="true" aria-label="Application update">
        {phase === "error" ? (
          <>
            <h2 style={TITLE}>Update failed</h2>
            <p style={BODY}>{error}</p>
            <div style={ACTIONS}>
              <button type="button" style={GHOST_BTN} onClick={() => setPhase("hidden")}>
                Close
              </button>
            </div>
          </>
        ) : phase === "downloaded" ? (
          <>
            <h2 style={TITLE}>Update ready</h2>
            <p style={BODY}>Version {version} has been downloaded. Restart to install it.</p>
            <div style={ACTIONS}>
              <button type="button" style={GHOST_BTN} onClick={() => setPhase("hidden")}>
                Later
              </button>
              <button type="button" style={PRIMARY_BTN} onClick={() => updater?.install()}>
                Restart &amp; install
              </button>
            </div>
          </>
        ) : phase === "downloading" ? (
          <>
            <h2 style={TITLE}>Downloading update…</h2>
            <div style={TRACK}>
              <div style={{ ...BAR, width: `${percent}%` }} />
            </div>
            <p style={{ ...BODY, fontVariantNumeric: "tabular-nums" }}>{percent}%</p>
          </>
        ) : (
          <>
            <h2 style={TITLE}>A new version is available</h2>
            <p style={BODY}>
              Version {version} is ready to download. Save your work before installing.
            </p>
            {notes !== "" ? <pre style={NOTES}>{notes}</pre> : null}
            <div style={ACTIONS}>
              <button type="button" style={GHOST_BTN} onClick={() => setPhase("hidden")}>
                Later
              </button>
              <button type="button" style={PRIMARY_BTN} onClick={() => void updater?.download()}>
                Download &amp; install
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Self-contained styling (the dialog sits outside the themed shell): a dimmed scrim over a light card,
// readable on any document theme behind it.
const SCRIM: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(15, 23, 42, 0.45)",
  fontFamily: "Inter, system-ui, sans-serif",
};
const CARD: CSSProperties = {
  width: "min(420px, calc(100vw - 32px))",
  padding: 24,
  borderRadius: 16,
  background: "#ffffff",
  color: "#1f2937",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.3)",
};
const TITLE: CSSProperties = { margin: "0 0 8px", fontSize: 17, fontWeight: 600 };
const BODY: CSSProperties = { margin: "0 0 16px", fontSize: 13, lineHeight: 1.5, color: "#5b6675" };
const NOTES: CSSProperties = {
  margin: "0 0 16px",
  maxHeight: 180,
  overflowY: "auto",
  padding: 12,
  borderRadius: 8,
  background: "#f5f7fb",
  color: "#5b6675",
  fontSize: 12,
  whiteSpace: "pre-wrap",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const ACTIONS: CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8 };
const PRIMARY_BTN: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "#2563eb",
  color: "#ffffff",
  font: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const GHOST_BTN: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #d8dee9",
  borderRadius: 8,
  background: "transparent",
  color: "#1f2937",
  font: "inherit",
  fontSize: 13,
  cursor: "pointer",
};
const TRACK: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "#eef1f7",
  overflow: "hidden",
  margin: "4px 0 12px",
};
const BAR: CSSProperties = { height: "100%", background: "#2563eb", transition: "width 0.2s ease" };

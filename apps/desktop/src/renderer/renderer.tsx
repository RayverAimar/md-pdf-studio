import { FONT_FACE_CSS } from "@md-pdf-studio/core";
import { Studio } from "@md-pdf-studio/ui";
import { createRoot } from "react-dom/client";
import { UpdateChecker } from "./UpdateChecker";

// The packaged window loads this bundle from file://, with no Next server to deliver the fonts. Inline the
// base64 @font-face blob (the same one the PDF embeds) so Inter / JetBrains Mono resolve with no external
// files; the editor chrome and preview then render identically to the web app.
const fontStyle = document.createElement("style");
fontStyle.textContent = FONT_FACE_CSS;
document.head.appendChild(fontStyle);

const container = document.getElementById("root");
if (container !== null)
  createRoot(container).render(
    <>
      <Studio />
      <UpdateChecker />
    </>,
  );

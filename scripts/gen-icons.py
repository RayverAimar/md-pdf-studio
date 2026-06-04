#!/usr/bin/env python3
# Regenerates every app/desktop icon, web favicon and the toolbar logo data URI from the single vector-
# free master assets/logo/icon-source.png. macOS-only (sips/iconutil for the .icns) and requires Pillow;
# the committed binaries are what ships, so this is a manual regen tool, not a build step.
import base64
import os
import subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
master = Image.open(os.path.join(ROOT, "assets/logo/icon-source.png")).convert("RGBA")


def out(*p):
    return os.path.join(ROOT, *p)


def png(size, path):
    master.resize((size, size), Image.LANCZOS).save(path)


# Desktop (electron-builder reads these by the build config)
png(512, out("apps/desktop/build/icon.png"))
master.resize((256, 256), Image.LANCZOS).save(
    out("apps/desktop/build/icon.ico"),
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

# Web favicons (Next app/ file convention). The .ico stays lean — only legacy sizes.
png(512, out("apps/web/app/icon.png"))
png(180, out("apps/web/app/apple-icon.png"))
master.resize((48, 48), Image.LANCZOS).save(
    out("apps/web/app/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
)

# macOS .icns via a native iconset + iconutil (Finder-accurate at every size).
iconset = "/tmp/mdpdf.iconset"
os.makedirs(iconset, exist_ok=True)
for s in (16, 32, 128, 256, 512):
    for scale, suffix in ((1, ""), (2, "@2x")):
        px = s * scale
        master.resize((px, px), Image.LANCZOS).save(f"{iconset}/icon_{s}x{s}{suffix}.png")
subprocess.run(
    ["iconutil", "-c", "icns", "-o", out("apps/desktop/build/icon.icns"), iconset], check=True
)

# Toolbar mark as a base64 data URI (the same embedding core/fonts.ts uses for the typefaces).
header = "/tmp/mdpdf-header-64.png"
master.resize((64, 64), Image.LANCZOS).save(header)
data_uri = "data:image/png;base64," + base64.b64encode(open(header, "rb").read()).decode()
with open(out("packages/ui/src/theme/brandLogo.ts"), "w") as f:
    f.write(
        "// The product mark, embedded as a base64 data URI so the shared toolbar renders it identically in the\n"
        "// web and desktop shells with no asset-serving path to wire (the same approach core/fonts.ts uses for\n"
        "// the bundled typefaces). Regenerated from assets/logo/icon-source.png by scripts/gen-icons.py.\n"
        "export const BRAND_LOGO_DATA_URI =\n"
        f'  "{data_uri}";\n'
    )

print("icons + favicons + brandLogo.ts regenerated from assets/logo/icon-source.png")

// Regenerates the app/desktop icon binaries and web favicons from the single vector master
// (assets/logo/mark.svg). macOS-first for .icns: iconutil produces Apple's canonical .icns layout
// that Finder renders correctly at every size, which png2icons' .icns cannot match — so .icns goes
// through a native .iconset + iconutil. The .ico and Linux .png go through png2icons run via
// `pnpm dlx`, so no dependency is added to the repo. The generated binaries (desktop build/icon.* and
// the web favicons) are COMMITTED: this regen tooling is macOS-only (sips/iconutil), so the multi-OS
// release CI cannot rebuild them on Windows/Linux. Rerun this on macOS when assets/logo/mark.svg changes.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

const SRC_SVG = resolve(REPO_ROOT, "assets/logo/mark.svg");
const DESKTOP_BUILD = resolve(REPO_ROOT, "apps/desktop/build");
const WEB_APP = resolve(REPO_ROOT, "apps/web/app");

const TMP_PNG = "/tmp/mdpdf-icon-1024.png";
const TMP_ICONSET = "/tmp/mdpdf.iconset";

// Native binaries iconutil/sips/iconutil only exist on macOS; fail with a clear message rather than
// emitting a half-built icon set.
function requireTool(bin) {
  try {
    execFileSync("command", ["-v", bin], { shell: "/bin/sh", stdio: "ignore" });
  } catch {
    throw new Error(`Required tool "${bin}" not found on PATH. See scripts/gen-icons.mjs header.`);
  }
}

function run(bin, args) {
  execFileSync(bin, args, { stdio: "inherit" });
}

for (const bin of ["rsvg-convert", "sips", "iconutil"]) requireTool(bin);

await mkdir(DESKTOP_BUILD, { recursive: true });
await mkdir(WEB_APP, { recursive: true });

// 1. Rasterize the vector master to a 1024px PNG (ideal png2icons input; crisp @2x icns).
run("rsvg-convert", ["-w", "1024", "-h", "1024", SRC_SVG, "-o", TMP_PNG]);

// 2a. macOS .icns the native way: build the 10 canonical iconset entries, then iconutil.
await rm(TMP_ICONSET, { recursive: true, force: true });
await mkdir(TMP_ICONSET, { recursive: true });
/** @type {[number, string][]} pixel size -> iconset filename */
const ICONSET = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
];
for (const [size, name] of ICONSET)
  run("sips", ["-z", String(size), String(size), TMP_PNG, "--out", `${TMP_ICONSET}/${name}`]);
await copyFile(TMP_PNG, `${TMP_ICONSET}/icon_512x512@2x.png`);
run("iconutil", ["-c", "icns", TMP_ICONSET, "-o", resolve(DESKTOP_BUILD, "icon.icns")]);

// 2b. Linux PNG (single >=512 is enough; electron-builder fans out the rest).
run("sips", ["-z", "512", "512", TMP_PNG, "--out", resolve(DESKTOP_BUILD, "icon.png")]);

// 2c. Windows .ico via png2icons (pure JS, no native, no dep added). It appends the extension, so the
// output path is passed WITHOUT ".ico". -ico writes 16..256; -bc selects bicubic resampling.
run("pnpm", ["dlx", "png2icons", TMP_PNG, resolve(DESKTOP_BUILD, "icon"), "-ico", "-bc"]);

// 3. Web favicons from the same master: the SVG is served directly, the PNGs via the file convention.
await copyFile(SRC_SVG, resolve(WEB_APP, "icon.svg"));
run("sips", ["-z", "180", "180", TMP_PNG, "--out", resolve(WEB_APP, "apple-icon.png")]);
run("pnpm", ["dlx", "png2icons", TMP_PNG, resolve(WEB_APP, "favicon"), "-ico", "-bc"]);

if (!existsSync(resolve(DESKTOP_BUILD, "icon.icns")))
  throw new Error("icon.icns was not produced — check the iconutil step above.");

process.stdout.write(`Wrote icons to ${DESKTOP_BUILD} and favicons to ${WEB_APP}\n`);

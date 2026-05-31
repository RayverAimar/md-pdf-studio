"use client";

import dynamic from "next/dynamic";

// The editor is browser-only (CodeMirror, web worker, localStorage), so it never server-renders.
const Studio = dynamic(() => import("@md-pdf-studio/ui").then((mod) => mod.Studio), { ssr: false });

export default function HomePage() {
  return <Studio />;
}

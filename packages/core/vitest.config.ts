import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors the `@/*` path alias in tsconfig.json so tests resolve it too. The `^@/` regex avoids
// colliding with scoped workspace imports like `@md-pdf-studio/core`.
const srcDir = fileURLToPath(new URL("./src/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: srcDir }],
  },
});

import { defineConfig } from "vitest/config";

// The covered logic is DOM-free (pipeline output, schema-derived grouping); a node environment keeps
// the suite fast and avoids pulling in a browser-DOM shim the components would otherwise need.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});

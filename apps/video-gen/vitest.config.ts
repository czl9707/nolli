// vitest has no tsconfig-paths support of its own — mirror the app tsconfig's
// `@/*` → `src/*` alias so tests can import source the same way the app does.
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
});

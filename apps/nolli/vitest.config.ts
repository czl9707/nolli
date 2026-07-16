import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@nolli/data": fileURLToPath(new URL("../../packages/data/src/index.ts", import.meta.url)),
      "@nolli/ui": fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
})

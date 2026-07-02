import { defineConfig } from "vitest/config"
import { join } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": join(process.cwd(), "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
})

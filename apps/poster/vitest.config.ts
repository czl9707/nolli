import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { join } from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": join(process.cwd(), "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})

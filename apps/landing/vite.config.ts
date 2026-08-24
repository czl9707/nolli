import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { join } from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": join(process.cwd(), "./src"),
    },
  },
})

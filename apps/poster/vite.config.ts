/// <reference types="vitest" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { join } from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": join(process.cwd(), "./src"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
})

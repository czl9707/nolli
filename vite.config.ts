import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { cpSync, mkdirSync } from "fs"
import { join } from "path"
import type { Plugin } from "vite"

function copyFontFiles(): Plugin {
  return {
    name: "copy-font-files",
    closeBundle() {
      const root = process.cwd()
      const fonts = [
        join(root, "node_modules/@fontsource/architects-daughter/files"),
        join(root, "node_modules/@fontsource/geist-mono/files"),
      ]
      const outDir = join(root, "dist/assets/files")
      mkdirSync(outDir, { recursive: true })
      for (const dir of fonts) {
        try {
          cpSync(dir, outDir, { recursive: true })
        } catch {}
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyFontFiles()],
  resolve: {
    alias: {
      "@": join(process.cwd(), "./src"),
    },
  },
})

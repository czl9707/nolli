import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { join } from "path"
import { sharedPublic } from "@nolli/ui/vite"

export default defineConfig({
  plugins: [react(), sharedPublic(join(process.cwd(), "../../packages/ui/public"))],
  resolve: {
    alias: {
      "@": join(process.cwd(), "./src"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
})

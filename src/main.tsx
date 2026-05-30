import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/global.css"
import { ViteApp } from "./vite-app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViteApp />
  </StrictMode>
)

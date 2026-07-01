import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/global.css"
import { App } from "./app"
import { ThemeSync } from "./components/theme-sync"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeSync />
    <App />
  </StrictMode>
)

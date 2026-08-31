import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { useThemeStore } from "@nolli/ui"
import { PrototypeApp } from "./app"
import "../styles/global.css"

// Whole app dark: the map style AND the page chrome vars.
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" })
document.body.dataset.theme = "dark"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrototypeApp />
  </StrictMode>,
)

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { useThemeStore } from "@nolli/ui"
import { App } from "./app"
import "./styles/global.css"

// Map always dark; page chrome stays on the light default vars.
// Direct setState (not setTheme) — no localStorage write, no body[data-theme].
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

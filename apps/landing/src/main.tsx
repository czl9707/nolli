import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { useThemeStore } from "@nolli/ui"
import { App } from "./app"
import "./styles/global.css"

// Map always dark; page chrome stays on the light default vars.
// Direct setState (not setTheme) — no localStorage write.
// body[data-theme] set directly so the UI kit's dark tokens apply (they key
// off the attribute, not the store).
useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" })
document.body.dataset.theme = "dark"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

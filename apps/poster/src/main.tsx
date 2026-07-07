import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/global.css"
import { PosterShell } from "./poster-shell"
import { ThemeSync } from "./components/shared/theme-sync"
import { Toaster } from "@nolli/ui"
// Side-effect: subscribes to the db bootstrap store and surfaces ready/error
// as a toast. Imported for the subscription, not the re-export.
import "@/stores/db"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeSync />
    <Toaster position="bottom-right" />
    <PosterShell />
  </StrictMode>
)

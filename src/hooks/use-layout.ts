import { useEffect } from "react"
import { useLocation } from "react-router"

export type LayoutMode = "board" | "home"

export function useLayout() {
  const location = useLocation()
  const mode: LayoutMode = location.pathname.startsWith("/arch/") ? "board" : "home"

  useEffect(() => {
    document.body.dataset.mode = mode
  }, [mode])

  return mode
}

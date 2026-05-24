import { useLocation } from "react-router"

export type LayoutMode = "board" | "home"

export function useLayout() {
  const location = useLocation()
  const mode: LayoutMode = location.pathname.startsWith("/arch/") ? "board" : "home"
  document.body.dataset.mode = mode
  return mode
}

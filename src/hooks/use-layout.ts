import { useLocation } from "react-router"

export type LayoutMode = "portfolio" | "home"

export function useLayout() {
  const location = useLocation();
  const mode: LayoutMode = location.pathname.startsWith("/arch/") ? "portfolio" : "home"
  document.body.dataset.mode = mode
  return mode
}

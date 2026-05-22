import { useLocation } from "react-router"

export type LayoutMode = "portfolio" | "home"

export function useLayout() {
  const location = useLocation();
  if (location.pathname.startsWith("/arch/")) {
    return "portfolio";
  }
  return "home";
}
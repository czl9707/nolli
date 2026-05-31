import { useEffect } from "react"
import { useLocation } from "react-router"
import { useLayoutStore, type LayoutMode } from "@/stores/layout"

export function LayoutSync() {
  const location = useLocation()
  const setMode = useLayoutStore((s) => s.setMode)

  useEffect(() => {
    const mode: LayoutMode = location.pathname.startsWith("/arch/")
      ? "board"
      : "home"
    setMode(mode)
  }, [location.pathname, setMode])

  return null
}

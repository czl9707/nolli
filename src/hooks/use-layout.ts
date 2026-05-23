import { useLocation } from "react-router"
import { useEffect, useRef } from "react"

export type LayoutMode = "portfolio" | "home"

export function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const target = e.target as HTMLElement
      if (target.closest(".maplibregl-map")) return
      e.preventDefault()
      el!.scrollLeft += e.deltaY
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el!.removeEventListener("wheel", onWheel)
  }, [])

  return ref
}

export function useLayout() {
  const location = useLocation();
  const mode: LayoutMode = location.pathname.startsWith("/arch/") ? "portfolio" : "home"
  document.body.dataset.mode = mode
  return mode
}

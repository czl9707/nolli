import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"

export function ArchSync() {
  const location = useLocation()
  const selectArch = useArchDetailStore((s) => s.select)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    selectArch(match[1], true)
  }, [location.pathname, selectArch])

  return null
}

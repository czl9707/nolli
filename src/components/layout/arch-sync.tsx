import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { useArchStore } from "@/stores/arch"

export function ArchSync() {
  const location = useLocation()
  const selectArch = useArchStore((s) => s.selectArch)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    selectArch(match[1])
  }, [location.pathname, selectArch])

  return null
}

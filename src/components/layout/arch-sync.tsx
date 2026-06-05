import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useDbStore } from "@/stores/db"

export function ArchSync() {
  const location = useLocation()
  const dataSource = useDbStore((s) => s.dataSource)
  const selectArch = useArchDetailStore((s) => s.selectArch)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    if (!dataSource) return
    prevSlugRef.current = match[1]
    selectArch(match[1], dataSource)
  }, [location.pathname, selectArch, dataSource])

  return null
}

import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { getArchBySlug } from "@/lib/data/architectures"
import { useArchStore } from "@/stores/arch"

export function ArchSync() {
  const location = useLocation()
  const setArch = useArchStore((s) => s.setArch)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    getArchBySlug(match[1]).then((arch) => {
      if (arch) setArch(arch)
    })
  }, [location.pathname, setArch])

  return null
}

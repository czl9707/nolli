import { useEffect, useRef } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayout } from "@/hooks/use-layout"

export function ArchSync() {
  const { archSlug } = useLayout()
  const selectArch = useArchDetailStore((s) => s.select)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    if (!archSlug || archSlug === prevSlugRef.current) return
    prevSlugRef.current = archSlug
    selectArch(archSlug, true)
  }, [archSlug, selectArch])

  return null
}

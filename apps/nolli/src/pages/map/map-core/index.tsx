import { useEffect } from "react"
import { useNavigate } from "react-router"
import { ArchMap } from "@nolli/map"
import { useMap, flyToArchCinematic } from "@nolli/map"
import { TRANSITION_SHORT } from "@nolli/ui"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayout } from "@/hooks/use-layout"
import { useDbStore } from "@/stores/db"
import { useFilterStore } from "@nolli/data"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchNavigate } from "@/hooks/use-arch-navigate"

/**
 * Flies the map to the selected building. Rendered as a child of <ArchMap>
 * so it can use the useMap() context. Reads nolli stores directly.
 */
function MapFlyNavigator() {
  const selected = useArchDetailStore((s) => s.selected)
  const shouldFlyTo = useArchDetailStore((s) => s.shouldFlyTo)
  const { isBoard } = useLayout()
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selected) return

    if (isBoard) {
      const timer = setTimeout(() => {
        flyToArchCinematic(
          map,
          selected.coordinates.lng,
          selected.coordinates.lat
        )
      }, TRANSITION_SHORT * 1000)
      return () => clearTimeout(timer)
    }

    if (shouldFlyTo) {
      flyToArchCinematic(map, selected.coordinates.lng, selected.coordinates.lat)
    }
  }, [map, selected, shouldFlyTo, isBoard])

  return null
}

/**
 * Thin wrapper around the shared <ArchMap>. Reads nolli stores and feeds them
 * as props; passes MapFlyNavigator as a child. Owns db-error navigation.
 */
export function MapCore() {
  const navigate = useNavigate()
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const selected = useArchDetailStore((s) => s.selected)
  const setOpen = useSidebarStore((s) => s.setOpen)
  const navigateArch = useArchNavigate()
  const { isMap } = useLayout()
  const loading = useDbStore((s) => s.loading)
  const error = useDbStore((s) => s.error)

  useEffect(() => {
    if (error != null) {
      navigate("/error")
    }
  }, [error, navigate])

  return (
    <ArchMap
      architectures={filteredArchs}
      selectedSlug={selected?.slug}
      onArchClick={(slug) => {
        setOpen(true)
        navigateArch(slug, false, "replace")
      }}
      ready={!loading}
      showControls={isMap}
    >
      <MapFlyNavigator />
    </ArchMap>
  )
}

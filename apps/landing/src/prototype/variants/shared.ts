// PROTOTYPE — per-variant hero/index rigs. The layout differs per variant;
// this is just the shared behavior (cursor springs, map handle, city fly).
import { useCallback, useRef, useState } from "react"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { fitCamera } from "@/lib/camera"
import { useCursorSprings } from "../reveal"

export function useHeroRig() {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapRef | null>(null)
  const { sx, sy } = useCursorSprings()
  return { surfaceRef, map, setMap, sx, sy }
}

/** City selection: swaps picks and flies the surface's map to fit them. */
export function useCityFly(
  picksByCity: Record<string, ArchSummary[]>,
  surfaceRef: React.RefObject<HTMLDivElement | null>,
  map: MapRef | null,
) {
  const [selected, setSelected] = useState("Paris")
  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const picks = picksByCity[name]
      const el = surfaceRef.current
      if (!picks?.length || !map || !el) return
      const r = el.getBoundingClientRect()
      const camera = fitCamera(
        picks.map((p) => p.coordinates),
        { width: r.width, height: r.height },
      )
      map.flyTo({ ...camera, essential: true, duration: 2600 })
    },
    [picksByCity, surfaceRef, map],
  )
  return { selected, onSelect }
}

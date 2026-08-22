import { forwardRef, useEffect, type ReactNode } from "react"
import { ArchMap, useMap, type MapRef, type SceneCamera } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"

/** Jump to the given camera once the map exists (ArchMap's viewport prop is init-only). */
function InitialCamera({ camera }: { camera: SceneCamera }) {
  const { map } = useMap()
  useEffect(() => {
    map?.jumpTo({ center: camera.center, zoom: camera.zoom })
  }, [map, camera])
  return null
}

export const LandingMap = forwardRef<
  MapRef,
  { summaries: ArchSummary[]; initial: SceneCamera; children?: ReactNode }
>(function LandingMap({ summaries, initial, children }, ref) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <ArchMap ref={ref} architectures={summaries} ready={true}>
        <InitialCamera camera={initial} />
        {children}
      </ArchMap>
    </div>
  )
})

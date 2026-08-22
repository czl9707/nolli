import type { ReactNode } from "react"
import { ArchMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"

type MapStageProps = {
  summaries: ArchSummary[]
  selectedSlug?: string
  center: [number, number]
  zoom: number
  children?: ReactNode
}

/**
 * Static, non-interactive map filling the section. Camera is set at init via
 * the `viewport` prop; for live camera moves render a `useMap()` jumper child
 * (ArchMap doesn't forward onViewportChange, so controlled mode never engages).
 */
export function MapStage({ summaries, selectedSlug, center, zoom, children }: MapStageProps) {
  return (
    <div className="stage__map">
      <ArchMap
        architectures={summaries}
        selectedSlug={selectedSlug}
        ready={true}
        viewport={{ center, zoom }}
      >
        {children}
      </ArchMap>
    </div>
  )
}

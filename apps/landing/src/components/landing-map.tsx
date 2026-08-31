import { forwardRef, type ReactNode } from "react"
import { ArchMap, type MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"

export const LandingMap = forwardRef<
  MapRef,
  { summaries: ArchSummary[]; children?: ReactNode }
>(function LandingMap({ summaries, children }, ref) {
  return (
    // data-arch-markers: the photo markers own the screen for the whole
    // spine — normal pin/cluster markers stay stood down
    // (photo-markers.module.css)
    <div data-arch-markers="off" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <ArchMap ref={ref} architectures={summaries} ready={true}>
        {children}
      </ArchMap>
    </div>
  )
})

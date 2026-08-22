import { forwardRef, type ReactNode } from "react"
import { ArchMap, type MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"

export const LandingMap = forwardRef<
  MapRef,
  { summaries: ArchSummary[]; children?: ReactNode }
>(function LandingMap({ summaries, children }, ref) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <ArchMap ref={ref} architectures={summaries} ready={true}>
        {children}
      </ArchMap>
    </div>
  )
})

// apps/video-gen/src/components/map/CameraSeries.tsx
import { useMemo } from "react"
import { Series, useCurrentFrame } from "remotion"
import { buildStaticSegments } from "@/lib/camera-segments"
import { Hold } from "./Hold"
import { WORLD_VP, type MapViewport } from "@/lib/viewport"
import type { ReelBuilding } from "@/lib/config"

/** Camera-segment chain as a <Series>. Memoized: re-renders every frame as a
 *  MapProvider descendant, but depends only on stable reel inputs. Static
 *  segments are all holds — one viewport for the whole reel. */
export const CameraSeries: React.FC<{
  buildings: ReelBuilding[]
  /** Poster-capture override; undefined = WORLD_VP. */
  vp?: MapViewport
}> = ({ buildings, vp = WORLD_VP }) => {
  const segments = useMemo(
    () => buildStaticSegments(buildings, vp),
    [buildings, vp]
  )
  // useCurrentFrame() inside a Series.Sequence is sequence-relative (constant
  // across a hold); the capture gate needs the absolute frame to re-run per frame.
  const absFrame = useCurrentFrame()
  return (
    <Series>
      {segments.map((s, i) => (
        <Series.Sequence
          key={i}
          durationInFrames={s.durationInFrames}
          layout="none"
        >
          {s.kind === "hold" ? (
            <Hold at={s.at} selectedSlug={s.selectedSlug} absFrame={absFrame} />
          ) : null}
        </Series.Sequence>
      ))}
    </Series>
  )
}

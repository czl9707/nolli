import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
} from "remotion"
import { ArchMap, type MapRef } from "@nolli/map"
import { useThemeStore } from "@nolli/ui"
import { useEffect, useState } from "react"
import type { ArchSummary } from "@nolli/data"
import type { MapViewport } from "../lib/viewport"

useThemeStore.setState({ theme: "dark", resolvedTheme: "dark" })

export const ReelMap: React.FC<{
  architectures: ArchSummary[]
  selectedSlug: string
  viewport: MapViewport
}> = ({ architectures, selectedSlug, viewport }) => {
  const frame = useCurrentFrame()
  const [map, setMap] = useState<MapRef | null>(null)

  // Hold the very first frame until the map has loaded + settled once.
  useEffect(() => {
    if (!map || map.loaded()) return
    const handle = delayRender("reel-map-load")
    let done = false
    const release = () => {
      if (!done) {
        done = true
        continueRender(handle)
      }
    }
    const onIdle = () => {
      if (map.loaded()) release()
    }
    map.once("idle", onIdle)
    return () => {
      map.off("idle", onIdle)
      release()
    }
  }, [map])

  // Drive the camera every frame; gate the screenshot on the repaint.
  useEffect(() => {
    if (!map) return
    const handle = delayRender(`reel-map frame ${frame}`)
    let done = false
    const release = () => {
      if (done) return
      done = true
      continueRender(handle)
    }
    map.jumpTo({ center: viewport.center, zoom: viewport.zoom })
    map.once("idle", release)
    return () => {
      map.off("idle", release)
      release()
    }
  }, [map, viewport.center[0], viewport.center[1], viewport.zoom, frame])

  return (
    <AbsoluteFill style={{ padding: 24 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <ArchMap
          ref={setMap}
          architectures={architectures}
          selectedSlug={selectedSlug}
          ready
          capture
        />
      </div>
    </AbsoluteFill>
  )
}

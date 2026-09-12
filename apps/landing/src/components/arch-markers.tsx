// The architect hold's marker set — every work is a photo card marker scattered
// around its building's coordinate (deterministic offset + tilt, like a
// tossed print). The lit architect's cards sit full color and larger; the
// rest darken via filter so overlaps stay solid. Portalled into the spine's
// map layer, so the cards ride the map for free.
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { MapContext, MapMarker, MarkerContent } from "@nolli/map"
import { PaperPhoto, TRANSITION_SHORT, hashId, jitter } from "@nolli/ui"
import { ROLL_EASE } from "@/lib/constants"
import { useMapPortal, useSpineMap } from "@/spine/spine"
import { useLinger } from "@/lib/use-linger"
import type { ArchEntry, ArchSummary } from "@/lib/landing-data"

const LIT_MAX = { w: 168, h: 112 }
const DIM_MAX = { w: 132, h: 88 }

/** Cards per architect, like the scatter before the marker migration. */
const WORKS_SHOWN = 4

export function ArchImageMarkers({
  entries,
  selectedId,
  on,
}: {
  entries: ArchEntry[]
  selectedId: number
  on: boolean
}) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const mapPortal = useMapPortal()
  if (!map || !mapPortal || !mounted) return null

  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {entries.flatMap((e) =>
        e.works.slice(0, WORKS_SHOWN).map((w) => (
          <ArchImageMarker key={w.slug} work={w} selected={e.id === selectedId} visible={visible} />
        )),
      )}
    </MapContext.Provider>,
    mapPortal,
  )
}

function ArchImageMarker({
  work,
  selected,
  visible,
}: {
  work: ArchSummary
  selected: boolean
  visible: boolean
}) {
  const s = hashId(work.slug)
  const { lng, lat } = work.coordinates
  const max = selected ? LIT_MAX : DIM_MAX
  const ratio = work.cover.width / work.cover.height
  const w = ratio >= max.w / max.h ? max.w : Math.round(max.h * ratio)
  const h = ratio >= max.w / max.h ? Math.round(max.w / ratio) : max.h
  return (
    <MapMarker
      longitude={lng + jitter(s, 32) - 16}
      latitude={lat + jitter(s + 11, 20) - 10}
      anchor="center"
      style={{ zIndex: selected ? 5 : 1 }}
    >
      <MarkerContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: visible ? 1 : 0,
            scale: selected ? 1.08 : 1,
            filter: selected ? "grayscale(0) brightness(1)" : "grayscale(0.7) brightness(0.5)",
          }}
          transition={{ duration: TRANSITION_SHORT, ease: ROLL_EASE }}
        >
          <PaperPhoto
            src={work.cover.image}
            alt={work.name}
            width={w}
            height={h}
            caption={work.name}
            seed={work.slug}
            tilt={28}
            crossOrigin={null}
          />
        </motion.div>
      </MarkerContent>
    </MapMarker>
  )
}

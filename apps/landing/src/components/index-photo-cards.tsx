import { useEffect, useState } from "react"
import { motion, useTransform } from "framer-motion"
import { useMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { useLandingStage } from "@/components/stage"

/** Card width in map-space px — the layer's CSS scale shrinks it with the morph. */
const CARD_W = 170
const ROTATE = [-3, 2, -1, 4, -2]
const LIFT = [-10, -34, 64, -12, 92]

/** Photo cards pinned at real coords inside the map layer, so they ride the
 * stage morph with the canvas. Re-projects on every move (flights fire
 * "move"). Fades itself via the stage context — map-layer children sit
 * outside the stage's per-scene fade wrappers. */
export function IndexPhotoCards({ picks }: { picks: ArchSummary[] }) {
  const { fade } = useLandingStage()
  const opacity = fade("index")
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"))
  const { map, isLoaded } = useMap()
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!map || !isLoaded) return
    const bump = () => setTick((t) => t + 1)
    map.on("move", bump)
    map.on("resize", bump)
    return () => {
      map.off("move", bump)
      map.off("resize", bump)
    }
  }, [map, isLoaded])

  if (!map || !isLoaded) return null
  const w = map.getCanvas().clientWidth
  const h = map.getCanvas().clientHeight
  const placed: { x: number; y: number }[] = []
  return (
    <motion.div className="index-cards" style={{ opacity, visibility }}>
      {picks.map((a, i) => {
        const pt = map.project([a.coordinates.lng, a.coordinates.lat])
        if (pt.x < -CARD_W || pt.x > w + CARD_W || pt.y < -CARD_W || pt.y > h + CARD_W) return null
        // cards that project onto an already-placed one fan out sideways
        const hits = placed.filter((q) => Math.hypot(q.x - pt.x, q.y - pt.y) < CARD_W * 0.7).length
        const x = pt.x + hits * 120 * (i % 2 === 0 ? -1 : 1)
        placed.push({ x: pt.x, y: pt.y })
        return (
          <figure
            key={a.slug}
            className="index-cards__card"
            style={{
              left: x,
              top: pt.y,
              width: CARD_W,
              rotate: `${ROTATE[i % ROTATE.length]}deg`,
              translate: `-50% calc(-110% + ${LIFT[i % LIFT.length]}px)`,
              zIndex: 10 + i,
            }}
          >
            <img
              src={a.cover.image}
              alt={a.name}
              loading="lazy"
              style={{ aspectRatio: `${a.cover.width} / ${a.cover.height}` }}
            />
            <figcaption className="index-cards__caption">{a.name}</figcaption>
          </figure>
        )
      })}
    </motion.div>
  )
}

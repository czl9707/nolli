import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion"
import type { ArchSummary } from "@nolli/data"
import type { LandingData } from "@/lib/landing-data"
import { useSceneScroll, useStage, useStageMap } from "@/stage/hooks"
import { PLATE } from "./hero"
import styles from "./hero.chrome.module.css"

/** Hero screen chrome: the content around the cursor-plate reveal. A
 * two-line statement dwells bottom-left; the index picks list top-right
 * highlights the pick currently under the plate; that pick's caption sits
 * bottom-right; the plate carries corner ticks, a north mark, and a live
 * lat/lng readout. Everything fades out with the hero scene fade. In snap
 * mode (touch / reduced motion) there is no plate, so the caption and
 * furniture stand down. */
export function HeroChrome({
  data,
  sx,
  sy,
}: {
  data: LandingData
  sx: MotionValue<number>
  sy: MotionValue<number>
}) {
  const { mode } = useStage()
  const local = useSceneScroll()
  // 1 through dwell (108vh), linear to 0 by 144vh — same curve as the plate
  const fade = useTransform(local, (v) =>
    v <= 108 ? 1 : Math.max(0, 1 - (v - 108) / 36),
  )
  const scrub = mode === "scrub"
  const picks = data.indexPhotos
  const { nearest, active } = usePlatePicks(sx, sy, picks)

  return (
    <motion.div className={styles.chromeRoot} style={{ opacity: fade }}>
      <Headline />
      <PickList picks={picks} active={active} />
      {scrub && (
        <>
          <NearestCaption nearest={nearest} />
          <PlateFurniture sx={sx} sy={sy} />
        </>
      )}
    </motion.div>
  )
}

const HEADLINE_LINES = [
  <>
    <span className={styles.headlineAccent}>Nolli</span> is a map
  </>,
  <>for architectures.</>,
]

function Headline() {
  const reduced = useReducedMotion()
  return (
    <h1 className={styles.headline}>
      {HEADLINE_LINES.map((line, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: "easeOut" }}
        >
          {line}
        </motion.div>
      ))}
    </h1>
  )
}

/** Radius (px, plate-centre to marker) within which a pick counts as
 * "revealed" by the plate. */
const REVEAL_R = 180

/** Tracks the pick nearest the plate centre (for the caption) plus the set
 * of picks currently inside the plate's reveal radius — the "being revealed
 * right now" set, not a visited history. The springs stream; this samples
 * per frame and only re-renders when the winner or membership changes. */
function usePlatePicks(sx: MotionValue<number>, sy: MotionValue<number>, picks: ArchSummary[]) {
  const map = useStageMap()
  const [nearest, setNearest] = useState<ArchSummary | null>(null)
  const [active, setActive] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!map || !picks.length) return
    let raf = 0
    const update = () => {
      raf = 0
      const cx = sx.get()
      const cy = sy.get()
      let best: ArchSummary | null = null
      let bestD = Infinity
      const inside: string[] = []
      for (const a of picks) {
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        const d = (p.x - cx) ** 2 + (p.y - cy) ** 2
        if (d < bestD) {
          bestD = d
          best = a
        }
        if (d < REVEAL_R ** 2) inside.push(a.slug)
      }
      setNearest((prev) => (prev?.slug === (best as ArchSummary | null)?.slug ? prev : best))
      setActive((prev) => {
        const same =
          prev.size === inside.length && inside.every((s) => prev.has(s))
        return same ? prev : new Set(inside)
      })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    map.on("move", schedule)
    schedule()
    return () => {
      u1()
      u2()
      map.off("move", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [map, sx, sy, picks])

  return { nearest, active }
}

function PickList({ picks, active }: { picks: ArchSummary[]; active: ReadonlySet<string> }) {
  const reduced = useReducedMotion()
  return (
    <motion.ul
      className={styles.pickList}
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
    >
      {picks.map((p) => (
        <li
          key={p.slug}
          className={`${styles.pick} ${active.has(p.slug) ? styles.pickActive : ""}`}
        >
          {p.name}
        </li>
      ))}
    </motion.ul>
  )
}

function NearestCaption({ nearest }: { nearest: ArchSummary | null }) {
  return (
    <div className={styles.caption}>
      <motion.div
        key={nearest?.slug ?? "none"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className={styles.captionName}>{nearest?.name ?? ""}</div>
        <div className={styles.captionMeta}>
          {nearest ? `${nearest.architect}, ${nearest.year}` : ""}
        </div>
      </motion.div>
    </div>
  )
}

function PlateFurniture({
  sx,
  sy,
}: {
  sx: MotionValue<number>
  sy: MotionValue<number>
}) {
  const map = useStageMap()
  const coordsRef = useRef<HTMLSpanElement>(null)

  // plate-centre lat/lng, written straight to the DOM from the springs —
  // frame-aligned, no state
  const updateCoords = () => {
    if (!map || !coordsRef.current) return
    const c = map.unproject([sx.get(), sy.get()])
    coordsRef.current.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}  ${Math.abs(
      c.lng,
    ).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`
  }
  useEffect(() => {
    const schedule = () => requestAnimationFrame(updateCoords)
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    schedule()
    return () => {
      u1()
      u2()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sx, sy])

  const x = useTransform(sx, (v) => v - PLATE.w / 2)
  const y = useTransform(sy, (v) => v - PLATE.h / 2)

  return (
    <motion.div className={styles.furniture} style={{ x, y, width: PLATE.w, height: PLATE.h }}>
      <span className={`${styles.tick} ${styles.tickTl}`} />
      <span className={`${styles.tick} ${styles.tickTr}`} />
      <span className={`${styles.tick} ${styles.tickBl}`} />
      <span className={`${styles.tick} ${styles.tickBr}`} />
      <span className={styles.north}>N ↑</span>
      <span ref={coordsRef} className={styles.coords} />
    </motion.div>
  )
}

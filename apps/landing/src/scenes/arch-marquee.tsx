// Architect marquee hold on the spine. The map owns the screen under a dark
// veil — the works scatter geo-approximately over it, each card around its
// building's projected coordinate — and the roster closes the scene as one
// block of equal cells along the bottom. Selection proves the statement: you
// can name an architect's works; the map can place them.
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValueEvent } from "framer-motion"
import { Body1, H3 } from "@nolli/ui"
import type { SceneCamera } from "@nolli/map"
import { flyToSceneCinematic } from "@nolli/map"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene } from "@/spine/timeline"
import type { ArchEntry, LandingData } from "@/lib/landing-data"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import { RollButton } from "@/components/roll-button"
import { RollText } from "@/components/roll-text"
import styles from "./arch-marquee.module.css"

const SCENE_ID = "arch"
const SCENE_VH = 160
const ENTRY_VH = 20

// world view widened so renderWorldCopies:false doesn't crop the roster's
// buildings (bounds ≈ −133°..157°)
const WORLD: SceneCamera = { center: [12, 25], zoom: 1.05 }

const WORKS_SHOWN = 4

export const archHold = (data: LandingData): HoldScene => ({
  kind: "hold",
  id: SCENE_ID,
  shape: "[data-spine-shape='arch']",
  heightVh: SCENE_VH,
  Component: () => <ArchMarquee roster={data.archRoster} />,
})

function ArchMarquee({ roster }: { roster: ArchEntry[] }) {
  const local = useSceneScroll(SCENE_ID)
  const map = useSpineMap()
  const flied = useRef(false)
  const [selected, setSelected] = useState(roster[0]?.name ?? "")
  const litEntry = roster.find((e) => e.name === selected) ?? roster[0]

  // the entry flight parks the camera at the world view when scroll hands
  // the scene the screen; the map layer may still be resizing out of the
  // shape morph, which mis-lands the ease — verify and snap if off
  useMotionValueEvent(local, "change", (v) => {
    if (v >= 0 && v < SCENE_VH && map) {
      if (flied.current) return
      flied.current = true
      flyToSceneCinematic(map, WORLD)
      map.once("moveend", () => {
        const c = map.getCenter()
        if (Math.abs(c.lng - WORLD.center[0]) > 1 || Math.abs(map.getZoom() - WORLD.zoom) > 0.05) {
          map.jumpTo({ center: WORLD.center, zoom: WORLD.zoom })
        }
      })
    } else {
      flied.current = false
    }
  })

  const rows: ArchEntry[][] = []
  const perRow = Math.ceil(roster.length / 2)
  for (let i = 0; i < roster.length; i += perRow) rows.push(roster.slice(i, i + perRow))

  return (
    <Screen className={styles.screen}>
      <HSplit>
        <Pane size="var(--size-header-height)" />
        <Pane>
          <VSplit>
            <Pane size="var(--grid-padding)" />
            <Pane>
              <HSplit>
                {/* map band — veil under the scatter, statement on top */}
                <Pane>
                  <div className={styles.veil} aria-hidden data-spine-shape="arch"/>
                  {litEntry && <Scatter entries={roster} litId={litEntry.id} />}
                  {litEntry && (
                    <div className={styles.bandText}>
                      <H3>
                        You can name the works of <RollText text={litEntry.name} />.
                      </H3>
                      <Body1 className={styles.statementSub}>
                        But you likely can't point them out on a map.
                      </Body1>
                    </div>
                  )}
                </Pane>
                {rows.map((row, r) => (
                  <Pane key={r} size="3.5rem">
                    <VSplit>
                      {row.map((e) => (
                        <RollButton
                          key={e.id}
                          size="calc(var(--grid-col) * 3)"
                          state={e.name === selected ? "focused" : "default"}
                          onClick={() => setSelected(e.name)}
                          onMouseEnter={() => setSelected(e.name)}
                          onFocus={() => setSelected(e.name)}
                          aria-pressed={e.name === selected}
                        >
                          {e.name}
                        </RollButton>
                      ))}
                    </VSplit>
                  </Pane>
                ))}
              </HSplit>
            </Pane>
            <Pane size="var(--grid-padding)" />
          </VSplit>
        </Pane>
      </HSplit>
    </Screen>
  )
}

// ── geo-approximate scatter ────────────────────────────────────────────────

/** Deterministic pseudo-random from a slug — stable across renders. */
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973
  return h
}
const rand = (seed: number, min: number, max: number) =>
  min + (((seed * 9301 + 49297) % 233280) / 233280) * (max - min)

/** Each card sits AROUND its work's projected coordinate (deterministic
 * jitter of ~±5% canvas), edge-clamped so rotated corners stay in the map
 * rect. Dim cards darken via filter (not opacity) so overlaps stay solid.
 * The field hides while the map is in motion — the entry flight and the
 * spine shape morph both reproject coordinates, so visible cards would
 * drift — and fades back in once parked. */
function Scatter({ entries, litId }: { entries: ArchEntry[]; litId: number }) {
  const map = useSpineMap()
  const [, force] = useState(0)
  const [stable, setStable] = useState(false)
  useEffect(() => {
    if (!map) return
    let t: ReturnType<typeof setTimeout> | undefined
    const bump = () => {
      force((n) => n + 1)
      setStable(false)
      clearTimeout(t)
      t = setTimeout(() => setStable(true), 250)
    }
    map.on("move", bump)
    map.on("resize", bump)
    bump()
    return () => {
      clearTimeout(t)
      map.off("move", bump)
      map.off("resize", bump)
    }
  }, [map])
  if (!map) return null

  const cw = map.getCanvas().clientWidth
  const ch = map.getCanvas().clientHeight
  const clampC = (v: number, card: number, space: number) =>
    Math.min(Math.max(v, card / 2 + 40), space - card / 2 - 40)
  const cards = entries.flatMap((e) =>
    e.works.slice(0, WORKS_SHOWN).map((w) => {
      const lit = e.id === litId
      const cardW = lit ? 168 : 132
      const cardH = (lit ? 112 : 88) + 30
      const s = hash(w.slug)
      const p = map.project([w.coordinates.lng, w.coordinates.lat])
      return {
        slug: w.slug,
        name: w.name,
        image: w.cover.image,
        lit,
        x: clampC(p.x + rand(s, -cw * 0.05, cw * 0.05), cardW, cw),
        y: clampC(p.y + rand(s + 11, -ch * 0.04, ch * 0.04), cardH, ch),
        rot: rand(s + 3, -14, 14),
      }
    }),
  )
  return (
    <div className={styles.field} style={{ opacity: stable ? 1 : 0 }}>
      {cards.map((c) => (
        <motion.figure
          key={c.slug}
          className={styles.polaroid}
          style={{
            left: c.x - (c.lit ? 168 : 132) / 2,
            top: c.y - ((c.lit ? 112 : 88) + 30) / 2,
            width: c.lit ? 168 : 132,
            zIndex: c.lit ? 5 : 1,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: c.lit ? 1.08 : 1,
            rotate: c.rot,
            filter: c.lit ? "grayscale(0) brightness(1)" : "grayscale(0.7) brightness(0.5)",
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={c.image} alt={c.name} style={{ height: c.lit ? 112 : 88 }} />
          <figcaption>{c.name}</figcaption>
        </motion.figure>
      ))}
    </div>
  )
}

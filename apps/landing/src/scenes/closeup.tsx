import styles from "./closeup.module.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, useMotionValueEvent } from "framer-motion"
import {
  BoardItem,
  LinkItem,
  NoteItem,
  PhotoItem,
  Pin,
  CANVAS_W,
  CANVAS_H,
  MAP_SLOT_X,
  MAP_SLOT_Y,
  layoutArchBoard,
  type PlacedArchItem,
} from "@nolli/board"
import { Body2, Body3, H3, H5, Note } from "@nolli/ui"
import { useLandingStage } from "@/components/stage"
import { APP_URL, SITE_ZOOM } from "@/lib/constants"
import { boardCtaLabel } from "@/lib/shape"
import { boardFit } from "@/lib/slots"
import type { LandingData } from "@/lib/landing-data"

/** Per-arch map-item relocation, in canvas px — the site-map slot (and the
 * layout anchor) shifts by this before each re-layout, so the map item moves
 * across the board while its camera flies to the new site. */
const MAP_SHIFT = [
  { x: 0, y: 0 },
  { x: -140, y: 90 },
  { x: 120, y: -100 },
  { x: -90, y: -110 },
  { x: 130, y: 80 },
]

type MetaFields = Extract<PlacedArchItem, { kind: "metadata" }>

/** Metadata card, the app pin-board's MetadataItem markup (name / By X, In
 * Y / address) plus the landing's CTA line. */
function MetaItem({
  slug,
  cta,
  delay,
  position,
  name,
  architect,
  year,
  address,
}: Omit<MetaFields, "position" | "kind"> & {
  slug: string
  cta: string
  delay: number
  position: MetaFields["position"]
}) {
  return (
    <BoardItem
      id={`${slug}-metadata`}
      position={position}
      delay={delay}
      className={styles.metaWrapper}
    >
      <H3 className={styles.name}>{name}</H3>
      <Note className={styles.architect}>
        <span style={{ opacity: 0.5 }}>By </span>
        {architect}
        <span style={{ opacity: 0.5 }}>, In </span>
        {year}
      </Note>
      <span style={{ flex: "1 1" }} />
      <Note className={styles.address}>{address}</Note>
      <Body2 asChild>
        <a className={styles.cta} href={APP_URL}>
          {cta}
        </a>
      </Body2>
    </BoardItem>
  )
}

/** Closeup overlay (prototype A winner) — the app's arch pin-board: the
 * CANVAS_W×CANVAS_H board fit into the viewport, items placed by
 * layoutArchBoard (photos/notes/links/metadata as @nolli/board items) around
 * the site-map slot, which the stage's map layer fills (paper frame under,
 * pin + label over). On arch switch the layout re-runs — items exit and
 * re-enter at fresh spots (AnimatePresence + BoardItem stagger) while the
 * map item relocates (stage --board-shift) and its camera flies. Only the
 * carousel + heading chrome stays pinned. */
export function CloseupScene({ data }: { data: LandingData }) {
  const { flyTo, mode, fade, setBoardShift } = useLandingStage()
  const set = data.boardSet
  const [i, setI] = useState(0)
  // init from the fade so a restored-scroll mount starts in the right state
  const [visible, setVisible] = useState(() => fade("closeup").get() > 0.5)
  const slugRef = useRef<string | null>(null)

  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  const fit = useMemo(() => boardFit(vp.w, vp.h), [vp])

  const go = useCallback(
    (d: number) => setI((v) => (v + d + set.length) % set.length),
    [set.length],
  )

  useMotionValueEvent(fade("closeup"), "change", (v) => setVisible(v > 0.5))

  // rotation (and its camera flights) only runs while the scene is on screen
  useEffect(() => {
    if (!visible) return
    const t = window.setInterval(() => go(1), 5000)
    return () => window.clearInterval(t)
  }, [go, i, visible])

  const arch = set[i]
  const d = MAP_SHIFT[i % MAP_SHIFT.length]

  // fresh scatter per arch: the marketing note rides along as a board note
  const items = useMemo(
    () =>
      layoutArchBoard(
        { ...arch, notes: [...arch.notes, { text: "each architecture is a story." }] },
        { x: MAP_SLOT_X + d.x, y: MAP_SLOT_Y + d.y },
      ),
    [arch, d],
  )

  // fly on arch switch while visible; the first fly is skipped — the stage
  // already enters closeup on the hero camera (= boardSet[0]). flyTo identity
  // is unstable (stage ctx rebuilds per render); arch/visible are the triggers.
  useEffect(() => {
    const first = slugRef.current === null
    slugRef.current = arch.slug
    if (!visible || first) return
    flyTo({ center: [arch.coordinates.lng, arch.coordinates.lat], zoom: SITE_ZOOM })
    setBoardShift(d.x * fit.s, d.y * fit.s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arch, visible, d, fit])

  // leaving the scene rewinds to arch 0 and clears the map-item shift: the
  // stage re-enters closeup on the hero camera, so board and map stay in sync
  useEffect(() => {
    if (visible) return
    if (i !== 0) setI(0)
    setBoardShift(0, 0)
  }, [visible, i, setBoardShift])

  return (
    <section className={styles.scene} style={{ pointerEvents: visible ? "auto" : "none" }}>
      <div className={styles.mapCard}>
        <Pin
          id="closeup-site"
          delay={1}
          className={styles.mapPin}
          style={{ top: "-42px", left: "50%" }}
        />
        {mode === "snap" && <div className={styles.mapFade} key={`fade-${arch.slug}`} />}
      </div>
      <div className={styles.note}>
        <BoardItem
          id="closeup-note"
          position={{ x: 0, y: 0, width: 300, height: 0, rotation: -2 }}
          className={styles.padNote}
        >
          <H3 className={styles.noteHand}>want to dig more?</H3>
          <Note className={styles.noteLine}>each architecture is a story.</Note>
        </BoardItem>
      </div>
      <div className={styles.carousel}>
        <BoardItem
          id="closeup-carousel"
          position={{ x: 0, y: 0, width: 300, height: 0, rotation: -1.4 }}
          className={styles.padCarousel}
        >
          <button type="button" onClick={() => go(-1)} aria-label="previous architecture">
            ←
          </button>
          <H5 className={styles.carouselName}>{arch.name}</H5>
          <button type="button" onClick={() => go(1)} aria-label="next architecture">
            →
          </button>
          <Body3 asChild>
            <span className={styles.counter}>
              {i + 1} / {set.length}
            </span>
          </Body3>
        </BoardItem>
      </div>
      <div
        className={styles.board}
        style={{
          left: fit.ox,
          top: fit.oy,
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${fit.s})`,
        }}
      >
        <div className={styles.dotGrid} />
        <AnimatePresence>
          {items.map((item, idx) => {
            const key = `${arch.slug}-${item.kind}-${idx}`
            switch (item.kind) {
              case "photo":
                return (
                  <PhotoItem
                    key={key}
                    kind="photo"
                    photo={item.photo}
                    position={item.position}
                    delay={idx}
                    crossOrigin={null}
                  />
                )
              case "note":
                return (
                  <NoteItem
                    key={key}
                    kind="note"
                    note={item.note}
                    position={item.position}
                    delay={idx}
                  />
                )
              case "links":
                return (
                  <LinkItem
                    key={key}
                    kind="links"
                    links={item.links}
                    position={item.position}
                    delay={idx}
                  />
                )
              case "metadata":
                return (
                  <MetaItem
                    key={key}
                    slug={arch.slug}
                    cta={boardCtaLabel(data.summaries, arch)}
                    delay={idx}
                    position={item.position}
                    name={item.name}
                    architect={item.architect}
                    year={item.year}
                    address={item.address}
                  />
                )
            }
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}

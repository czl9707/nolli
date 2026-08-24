import styles from "./closeup.module.css"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMotionValueEvent } from "framer-motion"
import { BoardItem, PhotoItem } from "@nolli/board"
import { Body2, Body3, H3, H5, Note } from "@nolli/ui"
import { useLandingStage } from "@/components/stage"
import { APP_URL, SITE_ZOOM } from "@/lib/constants"
import { boardCtaLabel } from "@/lib/shape"
import type { LandingData } from "@/lib/landing-data"

/** Per-arch tilt for the reappearing items — each arch settles at its own
 * slight rotation. */
const TILT = [0, -1.5, 2, -2.5, 1.5]

/** Closeup overlay (prototype A winner, rotating quilt board) on the stage:
 * the map window sits on a paper card rendered under the map layer (see
 * CloseupMapCard). On arch switch only the carousel stays pinned; the map
 * camera flies to the new site; everything else fades out and reappears
 * (BoardItem remounts replay the staggered entrance). Rotation drives stage
 * flights (cinematic in scrub, jumpTo + paper-mask in snap). */
export function CloseupScene({ data }: { data: LandingData }) {
  const { flyTo, mode, fade } = useLandingStage()
  const set = data.boardSet
  // i = live index (carousel, camera); shown = rendered arch (photos, meta)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const [out, setOut] = useState(false)
  // init from the fade so a restored-scroll mount starts in the right state
  const [visible, setVisible] = useState(() => fade("closeup").get() > 0.5)
  const slugRef = useRef<string | null>(null)

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

  // disappear → swap → reappear: fade the swap group out, exchange the
  // rendered arch, let the BoardItem remounts stagger back in
  useEffect(() => {
    if (i === shown) return
    setOut(true)
    const t = window.setTimeout(() => {
      setShown(i)
      setOut(false)
    }, 280)
    return () => window.clearTimeout(t)
  }, [i, shown])

  const arch = set[i]
  const s = set[shown]
  const r = TILT[shown % TILT.length]

  // fly on arch switch while visible; the first fly is skipped — the stage
  // already enters closeup on the hero camera (= boardSet[0]). flyTo identity
  // is unstable (stage ctx rebuilds per render); arch/visible are the triggers.
  useEffect(() => {
    const first = slugRef.current === null
    slugRef.current = arch.slug
    if (!visible || first) return
    flyTo({ center: [arch.coordinates.lng, arch.coordinates.lat], zoom: SITE_ZOOM })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arch, visible])

  // leaving the scene rewinds to arch 0: the stage re-enters closeup on the
  // hero camera, so board and map stay in sync without an extra flight
  useEffect(() => {
    if (!visible && i !== 0) setI(0)
  }, [visible, i])

  return (
    <section className={styles.scene} style={{ pointerEvents: visible ? "auto" : "none" }}>
      <div className={styles.mapCard}>
        <Note className={styles.mapLabel} key={`label-${arch.slug}`}>
          site — {arch.address}
        </Note>
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
      {/* swap group: everything arch-bound — photos + meta. Fades out on
          switch; the slug-keyed BoardItems remount with their entrance
          stagger for the reappear. */}
      <div className={`${styles.swap} ${out ? styles.swapOut : ""}`}>
        <div className={`${styles.photo} ${styles.photo1}`}>
          <PhotoItem
            kind="photo"
            photo={s.photos[0]}
            crossOrigin={null}
            position={{
              x: 0,
              y: 0,
              width: 330,
              height: Math.round((330 * s.photos[0].height) / s.photos[0].width),
              rotation: 2 + r,
            }}
            delay={2}
          />
        </div>
        <div className={`${styles.photo} ${styles.photo2}`}>
          <PhotoItem
            kind="photo"
            photo={s.photos[1]}
            crossOrigin={null}
            position={{ x: 0, y: 0, width: 185, height: 250, rotation: -2 + r }}
            delay={3}
          />
        </div>
        <div className={`${styles.photo} ${styles.photo3}`}>
          <PhotoItem
            kind="photo"
            photo={s.photos[2]}
            crossOrigin={null}
            position={{ x: 0, y: 0, width: 245, height: 165, rotation: -1 + r }}
            delay={4}
          />
        </div>
        <div className={styles.meta}>
          <BoardItem
            id={`${s.slug}-meta`}
            position={{ x: 0, y: 0, width: 295, height: 0, rotation: 1.2 + r }}
            delay={5}
            className={styles.padMeta}
          >
            <H5 className={styles.name}>{s.name}</H5>
            <dl>
              <div>
                <dt>architect</dt>
                <dd>{s.architect}</dd>
              </div>
              <div>
                <dt>year</dt>
                <dd>{s.year}</dd>
              </div>
              <div>
                <dt>address</dt>
                <dd>{s.address}</dd>
              </div>
            </dl>
            <Body2 asChild>
              <a className={styles.cta} href={APP_URL}>
                {boardCtaLabel(data.summaries, s)}
              </a>
            </Body2>
            <div className={styles.links}>
              {s.links?.wikipedia && (
                <a href={s.links.wikipedia} target="_blank" rel="noreferrer">
                  <Note className={styles.link}>wikipedia ↗</Note>
                </a>
              )}
              <a href={s.links?.googleMaps} target="_blank" rel="noreferrer">
                <Note className={styles.link}>google maps ↗</Note>
              </a>
            </div>
          </BoardItem>
        </div>
      </div>
    </section>
  )
}

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { useMotionValueEvent } from "framer-motion"
import { BoardItem } from "@nolli/board"
import { Note } from "@nolli/ui"
import { useLandingStage } from "@/components/stage"
import { APP_URL, SITE_ZOOM } from "@/lib/constants"
import { boardCtaLabel } from "@/lib/shape"
import type { LandingData } from "@/lib/landing-data"

/** Per-arch settle offsets — the board re-scatters a little on each switch.
 * dx/dy land on the anchor wrappers' transitioned translate; r flows into
 * each BoardItem's rotation prop. */
const SCATTER = [
  { r: 0, dx: 0, dy: 0 },
  { r: -1.5, dx: 14, dy: 10 },
  { r: 2, dx: -16, dy: 6 },
  { r: -2.5, dx: 8, dy: -12 },
  { r: 1.5, dx: -10, dy: 14 },
]

/** Closeup overlay (prototype A winner, rotating quilt board) on the stage:
 * the map card is a transparent window at CLOSEUP_SLOT — the stage's single
 * map layer settles into it. Rotation drives stage flights (cinematic in
 * scrub, jumpTo + paper-mask in snap). Paper items are @nolli/board
 * primitives: the viewport-fraction anchors stay as wrappers, BoardItem
 * renders inside at 0/0 with the scatter rotation. */
export function CloseupScene({ data }: { data: LandingData }) {
  const { flyTo, mode, fade } = useLandingStage()
  const set = data.boardSet
  const [i, setI] = useState(0)
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

  const arch = set[i]
  const s = SCATTER[i % SCATTER.length]

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
    <section
      className="closeup-scene closeup-rot"
      style={
        {
          "--b-dx": `${s.dx}px`,
          "--b-dy": `${s.dy}px`,
          pointerEvents: visible ? "auto" : "none",
        } as CSSProperties
      }
    >
      <div className="closeup-board__map">
        <Note className="closeup-board__maplabel" key={`label-${arch.slug}`}>
          site — {arch.address}
        </Note>
        {mode === "snap" && <div className="closeup-board__mapfade" key={`fade-${arch.slug}`} />}
      </div>
      <div className="closeup-board__note">
        <BoardItem
          id="closeup-note"
          position={{ x: 0, y: 0, width: 300, height: 0, rotation: -2 }}
          className="closeup-board__pad--note"
        >
          <Note className="closeup-board__notehand">want to dig more?</Note>
          <Note className="closeup-board__noteline">each architecture is a story.</Note>
        </BoardItem>
      </div>
      <div className="closeup-board__carousel">
        <BoardItem
          id="closeup-carousel"
          position={{ x: 0, y: 0, width: 300, height: 0, rotation: -1.4 }}
          delay={1}
          className="closeup-board__pad--carousel"
        >
          <button type="button" onClick={() => go(-1)} aria-label="previous architecture">
            ←
          </button>
          <Note className="closeup-board__carouselname">{arch.name}</Note>
          <button type="button" onClick={() => go(1)} aria-label="next architecture">
            →
          </button>
          <span className="closeup-board__counter">
            {i + 1} / {set.length}
          </span>
        </BoardItem>
      </div>
      <figure className="closeup-board__photo closeup-board__photo--1">
        <BoardItem
          id={`${arch.slug}-photo-1`}
          position={{ x: 0, y: 0, width: 330, height: 0, rotation: 2 + s.r }}
          delay={2}
        >
          <img key={arch.slug} src={arch.photos[0].image} alt={arch.name} />
          <Note className="closeup-board__photocaption" key={`${arch.slug}-c`}>
            {arch.name} · {arch.year}
          </Note>
        </BoardItem>
      </figure>
      <figure className="closeup-board__photo closeup-board__photo--2">
        <BoardItem
          id={`${arch.slug}-photo-2`}
          position={{ x: 0, y: 0, width: 185, height: 250, rotation: -2 + s.r }}
          delay={3}
        >
          <img key={arch.slug} src={arch.photos[1].image} alt={arch.name} />
        </BoardItem>
      </figure>
      <figure className="closeup-board__photo closeup-board__photo--3">
        <BoardItem
          id={`${arch.slug}-photo-3`}
          position={{ x: 0, y: 0, width: 245, height: 165, rotation: -1 + s.r }}
          delay={4}
        >
          <img key={arch.slug} src={arch.photos[2].image} alt={arch.name} />
        </BoardItem>
      </figure>
      <div className="closeup-board__meta">
        <BoardItem
          id={`${arch.slug}-meta`}
          position={{ x: 0, y: 0, width: 295, height: 0, rotation: 1.2 + s.r }}
          delay={5}
          className="closeup-board__pad--meta"
        >
          <div className="closeup-board__name">{arch.name}</div>
          <dl>
            <div>
              <dt>architect</dt>
              <dd>{arch.architect}</dd>
            </div>
            <div>
              <dt>year</dt>
              <dd>{arch.year}</dd>
            </div>
            <div>
              <dt>address</dt>
              <dd>{arch.address}</dd>
            </div>
          </dl>
          <a className="closeup-board__cta" href={APP_URL}>
            {boardCtaLabel(data.summaries, arch)}
          </a>
          <div className="closeup-board__links">
            {arch.links?.wikipedia && (
              <a href={arch.links.wikipedia} target="_blank" rel="noreferrer">
                <Note className="closeup-board__link">wikipedia ↗</Note>
              </a>
            )}
            <a href={arch.links?.googleMaps} target="_blank" rel="noreferrer">
              <Note className="closeup-board__link">google maps ↗</Note>
            </a>
          </div>
        </BoardItem>
      </div>
    </section>
  )
}

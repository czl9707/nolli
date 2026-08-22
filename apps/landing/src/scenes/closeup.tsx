import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { useMotionValueEvent } from "framer-motion"
import { useLandingStage } from "@/components/stage"
import { APP_URL, SITE_ZOOM } from "@/lib/constants"
import { boardCtaLabel } from "@/lib/shape"
import type { LandingData } from "@/lib/landing-data"

/** Per-arch settle offsets — the board re-scatters a little on each switch. */
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
 * scrub, jumpTo + paper-mask in snap). */
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
          "--b-r": `${s.r}deg`,
          "--b-dx": `${s.dx}px`,
          "--b-dy": `${s.dy}px`,
          pointerEvents: visible ? "auto" : "none",
        } as CSSProperties
      }
    >
      <div className="closeup-board__map">
        <span className="closeup-board__maplabel hand" key={`label-${arch.slug}`}>
          site — {arch.address}
        </span>
        {mode === "snap" && <div className="closeup-board__mapfade" key={`fade-${arch.slug}`} />}
      </div>
      <div className="closeup-board__note card pin">
        <p className="hand closeup-board__notehand">want to dig more?</p>
        <p className="closeup-board__noteline">each architecture is a story.</p>
      </div>
      <div className="closeup-board__carousel card pin">
        <button type="button" onClick={() => go(-1)} aria-label="previous architecture">
          ←
        </button>
        <span className="hand closeup-board__carouselname">{arch.name}</span>
        <button type="button" onClick={() => go(1)} aria-label="next architecture">
          →
        </button>
        <span className="closeup-board__counter">
          {i + 1} / {set.length}
        </span>
      </div>
      <figure className="card pin closeup-board__photo closeup-board__photo--1">
        <img key={arch.slug} src={arch.photos[0].image} alt={arch.name} />
        <figcaption className="hand closeup-board__photocaption" key={`${arch.slug}-c`}>
          {arch.name} · {arch.year}
        </figcaption>
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--2">
        <img key={arch.slug} src={arch.photos[1].image} alt={arch.name} />
      </figure>
      <figure className="card pin closeup-board__photo closeup-board__photo--3">
        <img key={arch.slug} src={arch.photos[2].image} alt={arch.name} />
      </figure>
      <div className="card pin closeup-board__meta">
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
              wikipedia ↗
            </a>
          )}
          <a href={arch.links?.googleMaps} target="_blank" rel="noreferrer">
            google maps ↗
          </a>
        </div>
      </div>
    </section>
  )
}

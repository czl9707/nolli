import { useCallback, useEffect, useMemo, useState } from "react"
import Lenis from "lenis"
import { Body2 } from "@nolli/ui"
import { useLandingData, type LandingData } from "@/lib/landing-data"
import { HERO_CAMERA } from "@/lib/constants"
import { Spine } from "@/spine/spine"
import type { PxRect, SpineScene } from "@/spine/timeline"
import { heroHold } from "@/scenes/hero"
import { heroCityTransition } from "@/scenes/hero-city-transition"
import { cityHold } from "@/scenes/city-ledger"
import { cityArchitectTransition } from "@/scenes/city-architect-transition"
import { architectHold } from "@/scenes/architect-ledger"
import { architectStatsTransition } from "@/scenes/architect-stats-transition"
import { statsHold } from "@/scenes/stats"
import { ScrollThumb } from "@/components/scroll-thumb"
import { SiteHeader } from "@/components/site-header"

const CITY_SHAPE = "[data-spine-shape='city']"

/** First-frame guess at the city pane — right side of the viewport, roughly
 * where the ledger split lands it. Only width/height feed the cameras, and
 * the post-paint measure replaces the guess a tick later. */
const cityPaneGuess = (): PxRect => ({
  left: window.innerWidth * 0.55,
  top: window.innerHeight * 0.1,
  width: window.innerWidth * 0.4,
  height: window.innerHeight * 0.8,
})

/** Scene list for the spine. The city pane rect comes from the DOM, which
 * only exists once the spine has mounted these scenes — so the first render
 * goes out on the guess and a post-paint measure swaps in the real geometry
 * (rebuilding the scenes, which re-runs the spine's shape measurement).
 * Re-measured on resize. */
function useSpineScenes(data: LandingData | null | undefined): SpineScene[] | null {
  const [cityPane, setCityPane] = useState<PxRect>(cityPaneGuess)
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>(CITY_SHAPE)
      if (!el) return
      const r = el.getBoundingClientRect()
      setCityPane((prev) =>
        prev.left === r.left && prev.top === r.top && prev.width === r.width && prev.height === r.height
          ? prev
          : { left: r.left, top: r.top, width: r.width, height: r.height },
      )
    }
    const t = window.setTimeout(measure, 0)
    window.addEventListener("resize", measure)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [data])
  return useMemo(
    () =>
      data
        ? [
            heroHold(data),
            heroCityTransition(),
            cityHold(cityPane),
            cityArchitectTransition(),
            architectHold(data),
            architectStatsTransition(),
            statsHold(data),
          ]
        : null,
    [data, cityPane],
  )
}

export function App() {
  const { status, data, error } = useLandingData()
  const scenes = useSpineScenes(data)
  const [revealed, setRevealed] = useState(false)
  const onMapIdle = useCallback(() => setRevealed(true), [])

  // wheel inertia — Lenis eases the native scroll to a stop; skipped for
  // reduced motion (the native step scroll is the accessible default)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  // the scroll spine stays still until the map can be seen: <main data-boot>
  // below + the body:has(main[data-boot]) lock in global.css
  if (status === "error") {
    return (
      <main data-boot={revealed ? undefined : ""}>
        <Body2>
          {error?.message ?? "failed to load map data"}
        </Body2>
      </main>
    )
  }

  return (
    <main data-boot={revealed ? undefined : ""}>
      {/* app chrome — fixed at this level it stacks above the spine's scene
          flow (z2) without a portal; main is no stacking context */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}>
        <SiteHeader />
      </div>
      <ScrollThumb />
      {data && scenes && (
        <Spine scenes={scenes} camera={HERO_CAMERA} onMapIdle={onMapIdle} />
      )}
    </main>
  )
}

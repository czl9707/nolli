import { useCallback, useEffect, useMemo, useState } from "react"
import Lenis from "lenis"
import { landingData } from "@/lib/landing-data"
import { Spine } from "@/spine/spine"
import type { SpineScene } from "@/spine/timeline"
import { heroCamera, heroHold } from "@/scenes/hero"
import { cityHold, heroCityTransition } from "@/scenes/city-ledger"
import { architectHold, cityArchitectTransition } from "@/scenes/architect-ledger"
import { statsHold, architectStatsTransition } from "@/scenes/stats"
import { statsFullTransition, footerHold } from "@/scenes/footer"
import { ScrollThumb } from "@/components/scroll-thumb"
import { SiteHeader } from "@/components/site-header"

export function App() {
  const scenes = useMemo<SpineScene[]>(
    () => [
      heroHold(landingData),
      heroCityTransition(),
      cityHold(landingData),
      cityArchitectTransition(),
      architectHold(landingData),
      architectStatsTransition(),
      statsHold(landingData),
      statsFullTransition(),
      footerHold(landingData),
    ],
    [],
  )
  const [revealed, setRevealed] = useState(false)
  const onMapIdle = useCallback(() => setRevealed(true), [])

  // boot camera = the hero's own fit, so the spine's initial placement
  // plants the map where the hero lands
  const bootCamera = useMemo(() => heroCamera(landingData), [])

  // wheel inertia — Lenis eases the native scroll to a stop; skipped for
  // reduced motion (the native step scroll is the accessible default)
  useEffect(() => {
    if (!revealed) return
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
  }, [revealed])

  // the scroll spine stays still until the map can be seen: <main data-boot>
  // below + the body:has(main[data-boot]) lock in global.css
  return (
    <main data-boot={revealed ? undefined : ""}>
      {/* app chrome — fixed at this level it stacks above the spine's scene
          flow (z2) without a portal; main is no stacking context */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}>
        <SiteHeader />
      </div>
      <ScrollThumb />
      <Spine scenes={scenes} camera={bootCamera} onMapIdle={onMapIdle} />
    </main>
  )
}

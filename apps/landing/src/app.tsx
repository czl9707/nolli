import { useCallback, useEffect, useMemo, useState } from "react"
import Lenis from "lenis"
import { Body2 } from "@nolli/ui"
import { useLandingData, type LandingData } from "@/lib/landing-data"
import { HERO_CAMERA } from "@/lib/constants"
import { Spine } from "@/spine/spine"
import type { SpineScene } from "@/spine/timeline"
import { heroHold } from "@/scenes/hero"
import { cityHold, heroCityTransition } from "@/scenes/city-ledger"
import { architectHold, cityArchitectTransition } from "@/scenes/architect-ledger"
import { statsHold, architectStatsTransition } from "@/scenes/stats"
import { statsFullTransition, footerHold } from "@/scenes/footer"
import { ScrollThumb } from "@/components/scroll-thumb"
import { SiteHeader } from "@/components/site-header"

/** Scene list for the spine. All data lands centrally in useLandingData and
 * scenes measure their own geometry at render time, so the list only
 * rebuilds when the data lands. */
function useSpineScenes(data: LandingData | null | undefined): SpineScene[] | null {
  return useMemo(
    () =>
      data
        ? [
            heroHold(data),
            heroCityTransition(),
            cityHold(data),
            cityArchitectTransition(),
            architectHold(data),
            architectStatsTransition(),
            statsHold(data),
            statsFullTransition(),
            footerHold(data),
          ]
        : null,
    [data],
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

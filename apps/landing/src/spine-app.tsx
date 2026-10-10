import { useEffect, useMemo } from "react"
import Lenis from "lenis"
import { registerLenis } from "@/lib/scroll-to"
import { landingData } from "@/lib/landing-data"
import { useBootPhase } from "@/lib/boot"
import { Spine } from "@/spine/spine"
import { SCREEN_SHAPE, type SpineScene, type TransitionScene } from "@/spine/timeline"
import { heroCamera, heroHold } from "@/scenes/hero"
import { cityHold } from "@/scenes/city-ledger"
import { architectHold } from "@/scenes/architect-ledger"
import { statsHold } from "@/scenes/stats"
import { SiteHeader } from "@/components/site-header"

/** The ledger → stats morph: the map grows from the stats card's shape
 * back to fullscreen across this span, scroll-driven, both directions.
 * One viewport tall — exactly the card's approach travel, so the morph
 * lands as the card parks. */
const architectStatsMorph: TransitionScene = {
  kind: "transition",
  id: "architect-stats",
  fromShape: SCREEN_SHAPE,
  toShape: "[data-spine-shape='stats']",
  heightVh: 100,
}

export function SpineApp() {
  const scenes = useMemo<SpineScene[]>(
    () => [
      heroHold(landingData),
      cityHold(landingData),
      architectHold(landingData),
      architectStatsMorph,
      statsHold(landingData),
    ],
    [],
  )
  const bootPhase = useBootPhase()
  const revealed = bootPhase === "done"

  // boot camera = the hero's own fit, so the spine's initial placement
  // plants the map where the hero lands
  const bootCamera = useMemo(() => heroCamera(landingData.heroArchs), [])

  // wheel inertia — Lenis eases the native scroll to a stop; skipped for
  // reduced motion (the native step scroll is the accessible default)
  useEffect(() => {
    if (!revealed) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    registerLenis(lenis)
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      registerLenis(null)
      lenis.destroy()
    }
  }, [revealed])

  // the scroll spine stays still until the boot sequence completes:
  // <main data-boot> below + the body:has(main[data-boot]) lock in global.css
  return (
    <main data-boot={revealed ? undefined : ""}>
      {/* app chrome — fixed at this level it stacks above the spine's scene
          flow (z2) without a portal; main is no stacking context. The header
          drives its own furniture-phase entrance (a subtree opacity fade
          here would form a backdrop root and delay the card's frost). */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}>
        <SiteHeader />
      </div>
      <Spine scenes={scenes} camera={bootCamera} />
    </main>
  )
}

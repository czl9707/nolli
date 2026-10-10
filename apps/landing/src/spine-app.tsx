import { useEffect, useMemo } from "react"
import Lenis from "lenis"
import { registerLenis } from "@/lib/scroll-to"
import { landingData } from "@/lib/landing-data"
import { useBootPhase } from "@/lib/boot"
import { Spine } from "@/spine/spine"
import type { SpineScene } from "@/spine/timeline"
import { heroCamera, heroHold } from "@/scenes/hero"
import { cityHold } from "@/scenes/city-ledger"
import { architectHold } from "@/scenes/architect-ledger"
import { statsHold } from "@/scenes/stats"
import { Footer } from "@/scenes/footer"
import { SiteHeader } from "@/components/site-header"

/** The morph's scroll runway between two holds — the shape lerps across it
 * as a pure function of scroll, so both directions replay the morph. The
 * tail rides 20vh into the next hold's opening, so dense content never
 * meets a morph that is already over. */
const TRANSITION_VH = 30
const TRANSITION_TAIL_VH = 30

const transition = (id: string, fromShape: string, toShape: string): SpineScene => ({
  kind: "transition",
  id,
  fromShape,
  toShape,
  heightVh: TRANSITION_VH,
  overrunVh: TRANSITION_TAIL_VH,
})

export function SpineApp() {
  const scenes = useMemo<SpineScene[]>(
    () => [
      heroHold(landingData),
      transition("hero-city", "[data-spine-shape='hero']", "[data-spine-shape='city']"),
      cityHold(landingData),
      transition("city-architect", "[data-spine-shape='city']", "[data-spine-shape='architect']"),
      architectHold(landingData),
      transition("architect-stats", "[data-spine-shape='architect']", "[data-spine-shape='stats']"),
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
    // html/body/#root are height:100%, so Lenis's own autoResize observer
    // never sees the page grow and its scroll limit goes stale (wheel dies
    // short of the real bottom; the native scrollbar doesn't). main is in
    // normal flow, so its box tracks the page — re-measure on its resize.
    const ro = new ResizeObserver(() => lenis.resize())
    ro.observe(document.querySelector("main") ?? document.body)
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
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
      {/* after the spine, in normal flow: the map frame stays sticky to the
          wrapper's end, so the footer ground covers it exactly as it
          departs — no overlap with the scenes above */}
      <Footer data={landingData} />
    </main>
  )
}

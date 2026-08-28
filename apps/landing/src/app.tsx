import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { MAP_COLORS } from "@nolli/map"
import { useLandingData } from "@/lib/landing-data"
import { LandingStage } from "@/stage/stage"
import { heroScene } from "@/scenes/hero"
import { indexScene } from "@/scenes/index"
import { ctaScene } from "@/scenes/cta"
import { FooterScene } from "@/scenes/footer"
import { HeroHeadline } from "@/scenes/hero.chrome"
import { ScrollThumb } from "@/components/scroll-thumb"

const FACTORIES = [heroScene, indexScene, ctaScene]

export function App() {
  const { status, data, error } = useLandingData()
  // viewport state re-runs the factories so the index plate re-fits on resize
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const registry = useMemo(
    () => (data ? FACTORIES.map((f) => f({ data, viewport: vp })) : null),
    [data, vp],
  )

  const [revealed, setRevealed] = useState(false)
  const [coverGone, setCoverGone] = useState(false)
  const onMapIdle = useCallback(() => setRevealed(true), [])

  if (status === "error") {
    return (
      <main>
        <p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p>
      </main>
    )
  }

  return (
    <main>
      <ScrollThumb />
      {data && registry && (
        <>
          <LandingStage scenes={registry} summaries={data.summaries} onMapIdle={onMapIdle} />
          <FooterScene data={data} />
        </>
      )}
      {!coverGone && <BootCover revealed={revealed} onGone={() => setCoverGone(true)} />}
    </main>
  )
}

/** Ink cover over the not-yet-settled map. Same background colour as the map
 * style and the same headline as the hero chrome, so its fade-out reads as
 * the hero arriving rather than a loader finishing. */
function BootCover({ revealed, onGone }: { revealed: boolean; onGone: () => void }) {
  const reduced = useReducedMotion()
  // hold the scroll spine still until the map can be seen
  useEffect(() => {
    const body = document.body
    const prev = body.style.overflow
    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = prev
    }
  }, [])
  return (
    <motion.div
      className="boot-cover"
      style={{ background: MAP_COLORS.dark.bg }}
      initial={{ opacity: 1 }}
      animate={{ opacity: revealed ? 0 : 1 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
      onAnimationComplete={() => revealed && onGone()}
    >
      <HeroHeadline />
    </motion.div>
  )
}

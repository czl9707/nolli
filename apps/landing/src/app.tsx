import { useEffect, useMemo, useState } from "react"
import { useLandingData } from "@/lib/landing-data"
import { LandingStage } from "@/stage/stage"
import { heroScene } from "@/scenes/hero"
import { indexScene } from "@/scenes/index"
import { ctaScene } from "@/scenes/cta"
import { FooterScene } from "@/scenes/footer"

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

  if (status === "loading") return <main><p className="boot-msg">loading the map…</p></main>
  if (status === "error" || !data || !registry) {
    return <main><p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p></main>
  }

  return (
    <main>
      <LandingStage scenes={registry} summaries={data.summaries} />
      <FooterScene data={data} />
    </main>
  )
}

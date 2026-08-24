import type { ReactNode } from "react"
import { useLandingData } from "@/lib/landing-data"
import { LandingStage } from "@/components/stage"
import { IndexPhotoMarkers } from "@/components/index-photo-markers"
import { HeroScene } from "@/scenes/hero"
import { IndexFrame, IndexCopy } from "@/scenes/index-scene"
import { CtaScene } from "@/scenes/cta"
import { FooterScene } from "@/scenes/footer"
import { SCENES } from "@/lib/spine"
import type { SceneId } from "@/lib/spine"

export function App() {
  const { status, data, error } = useLandingData()
  if (status === "loading") return <main><p className="boot-msg">loading the map…</p></main>
  if (status === "error" || !data) {
    return <main><p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p></main>
  }
  // pinned overlays: map-attached chrome only (index slot frame)
  const scenes: Partial<Record<SceneId, ReactNode>> = {
    index: <IndexFrame key="index" />,
    footer: <FooterScene key="footer" data={data} />,
  }
  // flow ranges mirror the scenes' heightVh so the spine's scroll budget
  // (and every scene boundary) is unchanged; the hero block owns its own
  // geometry (do not wrap)
  const heightOf = (id: SceneId) => SCENES.find((s) => s.id === id)!.heightVh
  const flows = [
    { id: "hero" as const, node: <HeroScene key="hero" data={data} /> },
    {
      id: "index" as const,
      heightVh: heightOf("index"),
      node: <IndexCopy key="index" data={data} />,
    },
    {
      id: "cta" as const,
      heightVh: heightOf("cta"),
      node: <CtaScene key="cta" data={data} />,
    },
  ]
  return (
    <main>
      <LandingStage
        data={data}
        scenes={scenes}
        flows={flows}
        mapChildren={<IndexPhotoMarkers picks={data.indexPhotos} />}
      />
    </main>
  )
}

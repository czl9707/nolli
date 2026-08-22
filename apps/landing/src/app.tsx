import type { ReactNode } from "react"
import { useLandingData } from "@/lib/landing-data"
import { LandingStage } from "@/components/stage"
import { IndexPhotoCards } from "@/components/index-photo-cards"
import { HeroScene } from "@/scenes/hero"
import { IndexScene } from "@/scenes/index-scene"
import { CloseupScene } from "@/scenes/closeup"
import { CtaScene } from "@/scenes/cta"
import { FooterScene } from "@/scenes/footer"
import type { SceneId } from "@/lib/spine"

export function App() {
  const { status, data, error } = useLandingData()
  if (status === "loading") return <main><p className="boot-msg">loading the map…</p></main>
  if (status === "error" || !data) {
    return <main><p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p></main>
  }
  const scenes: Record<SceneId, ReactNode> = {
    hero: <HeroScene key="hero" data={data} />,
    index: <IndexScene key="index" data={data} />,
    closeup: <CloseupScene key="closeup" data={data} />,
    cta: <CtaScene key="cta" data={data} />,
    footer: <FooterScene key="footer" data={data} />,
  }
  return (
    <main>
      <LandingStage
        data={data}
        scenes={scenes}
        mapChildren={<IndexPhotoCards picks={data.indexPhotos} />}
      />
    </main>
  )
}

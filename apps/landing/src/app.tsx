import type { ReactNode } from "react"
import { useLandingData } from "@/lib/landing-data"
import { LandingStage } from "@/components/stage"
import type { SceneId } from "@/lib/spine"

function SceneStub({ label }: { label: string }) {
  return <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{label}</div>
}

export function App() {
  const { status, data, error } = useLandingData()
  if (status === "loading") return <main><p className="boot-msg">loading the map…</p></main>
  if (status === "error" || !data) {
    return <main><p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p></main>
  }
  const scenes: Record<SceneId, ReactNode> = {
    hero: <SceneStub key="hero" label="hero" />,
    index: <SceneStub key="index" label="index" />,
    closeup: <SceneStub key="closeup" label="closeup" />,
    cta: <SceneStub key="cta" label="cta" />,
    footer: <SceneStub key="footer" label="footer" />,
  }
  return (
    <main>
      <LandingStage data={data} scenes={scenes} />
    </main>
  )
}

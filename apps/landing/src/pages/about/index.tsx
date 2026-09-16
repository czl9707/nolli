import { Seo } from "@/components/seo"
import { StaticShell } from "@/components/static-shell"
import { aboutContent } from "./about.content"

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Nolli — the first map built for how architects actually think. Figure-ground map meets pin-up board."
        path="/about"
      />
      <StaticShell content={aboutContent} />
    </>
  )
}

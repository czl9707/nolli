// src/components/pages/about/about.tsx

import { Seo } from "@/components/seo"
import { ContentSections } from "@/components/pages/content-sections"
import { PageShell } from "@/components/pages/page-shell"
import { aboutContent } from "./about.content"

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Nolli — the first map built for how architects actually think. Figure-ground map meets pin-up board."
        path="/about"
      />
      <PageShell title={aboutContent.title} lead={aboutContent.lead}>
        <ContentSections sections={aboutContent.sections} />
      </PageShell>
    </>
  )
}

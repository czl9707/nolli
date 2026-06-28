// src/pages/about/about.tsx

import { Seo } from "@/components/layout/seo"
import { Body1, H3 } from "@/components/ui/typography"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { aboutContent } from "./about.content"

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Nolli — the first map built for how architects actually think. Figure-ground map meets pin-up board."
        path="/about"
      />
      <StaticPageShell title={aboutContent.title} lead={aboutContent.lead}>
        {aboutContent.blocks.map((block, i) => (
          <Section key={i}>
            {block.title && <H3><b>{block.title}</b></H3>}
            {block.content.map((p, j) => (
              <Body1 key={j}>{p}</Body1>
            ))}
          </Section>
        ))}
      </StaticPageShell>
    </>
  )
}

// src/pages/privacy/privacy.tsx

import { Seo } from "@/components/layout/seo"
import { Body1, H4 } from "@/components/ui/typography"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { privacyContent } from "./privacy.content"

export function PrivacyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="What Nolli collects (very little), how sign-in works, and your rights."
        path="/privacy"
      />
      <StaticPageShell
        title={privacyContent.title}
        lastUpdated={privacyContent.lastUpdated}
      >
        {privacyContent.blocks.map((block, i) => (
          <Section key={i}>
            {block.title && <H4><b>{block.title}</b></H4>}
            {block.content.map((p, j) => (
              <Body1 key={j}>{p}</Body1>
            ))}
          </Section>
        ))}
      </StaticPageShell>
    </>
  )
}

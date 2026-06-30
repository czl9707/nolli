// src/pages/terms/terms.tsx

import { Seo } from "@/components/layout/seo"
import { Body1, H4 } from "@nolli/ui"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { termsContent } from "./terms.content"

export function TermsPage() {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="The terms you agree to when using Nolli."
        path="/terms"
      />
      <StaticPageShell
        title={termsContent.title}
        lastUpdated={termsContent.lastUpdated}
      >
        {termsContent.blocks.map((block, i) => (
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

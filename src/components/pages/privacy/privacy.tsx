// src/components/pages/privacy/privacy.tsx

import { Seo } from "@/components/seo"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"
import { ContentSections } from "@/components/pages/content-sections"
import { PageShell } from "@/components/pages/page-shell"
import shellStyles from "@/components/pages/page-shell.module.css"
import { privacyContent } from "./privacy.content"

export function PrivacyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="What Nolli collects (very little), how sign-in works, and your rights."
        path="/privacy"
      />
      <PageShell
        title={privacyContent.title}
        lastUpdated={privacyContent.lastUpdated}
      >
        <ContentSections sections={privacyContent.sections} />
        <section className={shellStyles.contact}>
          <H2>Contact</H2>
          <Button asChild variant="link">
            <a href={`mailto:${privacyContent.contactEmail}`}>
              {privacyContent.contactEmail}
            </a>
          </Button>
        </section>
      </PageShell>
    </>
  )
}

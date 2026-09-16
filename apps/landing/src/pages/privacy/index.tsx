import { Seo } from "@/components/seo"
import { StaticShell } from "@/components/static-shell"
import { privacyContent } from "./privacy.content"

export default function PrivacyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="What Nolli collects (very little), how sign-in works, and your rights."
        path="/privacy"
      />
      <StaticShell content={privacyContent} />
    </>
  )
}

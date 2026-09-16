import { Seo } from "@/components/seo"
import { StaticShell } from "@/components/static-shell"
import { termsContent } from "./terms.content"

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="The terms you agree to when using Nolli."
        path="/terms"
      />
      <StaticShell content={termsContent} />
    </>
  )
}

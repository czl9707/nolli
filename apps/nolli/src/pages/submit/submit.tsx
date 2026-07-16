import { useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@nolli/ui"
import { Seo } from "@/components/layout/seo"
import { SubmissionShell } from "@/components/submission/submission-shell"
import { SubmissionFields } from "@/components/submission/submission-fields"
import { useSubmissionForm, EMPTY } from "@/components/submission/use-submission-form"
import { createSubmission } from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import styles from "@/components/submission/submission-shell.module.css"

const TITLE = "Submit a building";

export function SubmitPage() {
  const { user, initialized, signIn } = useAuthStore()
  const { form, saving, submit } = useSubmissionForm({
    onSubmit: async (payload) => {
      await createSubmission(payload)
      toast.success("Submitted for review.")
      form.reset(EMPTY)
    },
  })

  useEffect(() => {
    if (initialized && !user) void signIn()
  }, [initialized, user, signIn])

  const inFlight = form.formState.isSubmitting || saving

  return (
    <>
      <Seo title={TITLE} description="Suggest a new building for the Nolli map." path="/submit" />
      <SubmissionShell
        title={TITLE}
        lead="Suggest a new building for the map."
        ready={initialized && !!user}
        onSubmit={submit}
        actions={
          <div className={styles.createBar}>
            <Button type="submit" disabled={inFlight || !form.formState.isValid}>
              {inFlight ? <Loader2 size={16} className={styles.spin} /> : "Submit"}
            </Button>
          </div>
        }
      >
        <SubmissionFields form={form} />
      </SubmissionShell>
    </>
  )
}

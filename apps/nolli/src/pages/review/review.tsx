import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from "@nolli/ui"
import { Seo } from "@/components/layout/seo"
import { SubmissionShell } from "@/components/submission/submission-shell"
import { SubmissionFields } from "@/components/submission/submission-fields"
import { useSubmissionForm, handleError } from "@/components/submission/use-submission-form"
import { payloadToFormValues } from "@/components/submission/shape-payload"
import {
  getSubmission,
  patchSubmission,
  decideSubmission,
  UnauthorizedError,
} from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import styles from "@/components/submission/submission-shell.module.css"

export function ReviewPage() {
  const { user, initialized, signIn } = useAuthStore()
  const isMod = user?.role === "moderator" || user?.role === "admin"
  const navigate = useNavigate()
  const params = useParams()
  const id = Number(params.id)

  const { form, saving, submit } = useSubmissionForm({
    onSubmit: async (payload, values) => {
      await patchSubmission(id, payload)
      toast.success("Saved.")
      form.reset(values)
    },
  })

  const [loadingReview, setLoadingReview] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState("")

  // Load the existing payload once authed. Gated so we never fetch before the
  // user is signed in, and so invalid/non-mod ids short-circuit to an error.
  useEffect(() => {
    if (!initialized || !isMod || !Number.isInteger(id)) return
    let cancelled = false
    setLoadingReview(true)
    getSubmission(id)
      .then(({ submission }) => {
        if (!cancelled) {
          form.reset(payloadToFormValues(submission.payload))
          setLoadError(false)
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) void signIn()
        else setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingReview(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialized, isMod, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const error = !Number.isInteger(id)
    ? "Invalid submission."
    : initialized && !isMod
      ? "Not available."
      : loadError
        ? "Could not load this submission."
        : undefined

  async function onDecide(decision: "approve" | "reject", note: string) {
    setDeciding(true)
    try {
      await decideSubmission(id, decision, note)
      toast.success(decision === "approve" ? "Approved." : "Rejected.")
      navigate("/moderate")
    } catch (err) {
      handleError(err, signIn)
    } finally {
      setDeciding(false)
    }
  }

  return (
    <>
      <Seo title="Review submission" description="Review a building submission." path={`/moderate/${id}`} />
      <SubmissionShell
        title="Review submission"
        lead="Edit, then approve or reject."
        ready={!error && initialized && !loadingReview}
        error={error}
        onSubmit={submit}
        actions={
          <div className={styles.decideBar}>
            <Button
              variant="outline"
              onClick={submit}
              disabled={!form.formState.isDirty || saving || !form.formState.isValid}
            >
              {saving ? <Loader2 size={16} className={styles.spin} /> : "Save changes"}
            </Button>
            <div className={styles.decisions}>
              <Button
                onClick={() => onDecide("approve", "")}
                disabled={form.formState.isDirty || deciding}
              >
                {deciding ? <Loader2 size={16} className={styles.spin} /> : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={form.formState.isDirty || deciding}
              >
                Reject
              </Button>
            </div>
          </div>
        }
      >
        <SubmissionFields form={form} />
      </SubmissionShell>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this submission?</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectOpen(false)
                onDecide("reject", note)
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

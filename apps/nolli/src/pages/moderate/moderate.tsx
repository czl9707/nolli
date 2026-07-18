import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Body2,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from "@nolli/ui"
import { Seo } from "@/components/layout/seo"
import { SubmissionList, SubmissionRow } from "@/components/submission/submission-list"
import { SubmissionShell } from "@/components/submission/submission-shell"
import { SubmissionFields } from "@/components/submission/submission-fields"
import { useSubmissionForm, handleError } from "@/components/submission/use-submission-form"
import { payloadToFormValues } from "@/components/submission/shape-payload"
import {
  listQueue,
  getSubmission,
  patchSubmission,
  decideSubmission,
  type QueueEntry,
} from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import styles from "@/components/submission/submission-shell.module.css"
import { SideBar } from "../map/side-bar"

function useQueue(isMod: boolean, initialized: boolean) {
  const [entries, setEntries] = useState<QueueEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!initialized || !isMod) return
    let cancelled = false
    setEntries(null)
    setError(null)
    listQueue()
      .then((r) => { if (!cancelled) setEntries(r.submissions) })
      .catch(() => { if (!cancelled) setError("Failed to load submissions.") })
    return () => { cancelled = true }
  }, [initialized, isMod, retryKey])

  return {
    entries,
    error,
    loading: entries === null && !error,
    retry: () => setRetryKey((k) => k + 1),
  }
}

export function ModeratePage() {
  const { user, initialized } = useAuthStore()
  const isMod = user?.role === "moderator" || user?.role === "admin"
  const params = useParams()
  const id = Number(params.id)

  const queue = useQueue(isMod, initialized)

  let main: ReactNode
  if (!initialized) {
    main = <SubmissionShell title="Moderate" ready={false} />
  } else if (!isMod) {
    main = <SubmissionShell title="Moderate" error="Not a Moderator." />
  } else if (Number.isInteger(id)) {
    main = <ReviewForm id={id} bump={queue.retry} />
  } else {
    main = (
      <div className={styles.empty}>
        <Body2>Select a submission to review.</Body2>
      </div>
    )
  }

  const list = isMod ? (
    <SubmissionList
      entries={queue.entries ?? []}
      loading={queue.loading}
      error={queue.error}
      emptyText="Nothing to review."
      renderRow={(e) => (
        <SubmissionRow
          entry={e}
          to={`/moderate/${e.id}`}
          selected={e.id === id}
          foot={`${e.submitter_name ?? "anonymous"} · ${new Date(e.created_at).toLocaleDateString()}`}
        />
      )}
    />
  ) : null

  return (
    <>
      <Seo title="Moderate" description="Review building submissions." path="/moderate" />
      <SideBar>{list}</SideBar>
      {main}
    </>
  )
}

function ReviewForm({ id, bump }: { id: number; bump: () => void }) {
  const { form, saving, submit } = useSubmissionForm({
    onSubmit: async (payload, values) => {
      await patchSubmission(id, payload)
      toast.success("Saved.")
      form.reset(values)
      bump()
    },
  })

  const navigate = useNavigate();
  const [loadingReview, setLoadingReview] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!Number.isInteger(id)) return
    let cancelled = false
    setLoadingReview(true)
    setNote("")
    setRejectOpen(false)
    getSubmission(id)
      .then(({ submission }) => {
        if (!cancelled) {
          form.reset(payloadToFormValues(submission.payload))
          setLoadError(false)
        }
      })
      .catch(() => {
        if (cancelled) return
        else setLoadError(true)
      })
      .finally(() => { if (!cancelled) setLoadingReview(false) })
    return () => { cancelled = true }
  }, [id]) 

  async function onDecide(decision: "approve" | "reject", note: string) {
    setDeciding(true)
    try {
      await decideSubmission(id, decision, note)
      toast.success(decision === "approve" ? "Approved." : "Rejected.")
      navigate("/moderate")
      bump()
    } catch (err) {
      handleError(err)
    } finally {
      setDeciding(false)
    }
  }

  const error = loadError ? "Could not load this submission." : undefined

  return (
    <>
      <SubmissionShell
        title="Review submission"
        lead="Edit, then approve or reject."
        ready={!error && !loadingReview}
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
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { setRejectOpen(false); onDecide("reject", note) }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

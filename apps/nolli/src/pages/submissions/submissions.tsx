import { useEffect, useState, type ReactNode } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Body2, Button } from "@nolli/ui"
import { Seo } from "@/components/layout/seo"
import { NewSubmissionCard, SubmissionList, SubmissionRow } from "@/components/submission/submission-list"
import { SubmissionShell } from "@/components/submission/submission-shell"
import { SubmissionFields } from "@/components/submission/submission-fields"
import { useSubmissionForm } from "@/components/submission/use-submission-form"
import { payloadToFormValues } from "@/components/submission/shape-payload"
import {
  listMine,
  getSubmission,
  createSubmission,
  patchSubmission,
  type MineEntry,
} from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import styles from "@/components/submission/submission-shell.module.css"
import { SideBar } from "../map/side-bar"

export function SubmissionsPage() {
  const { user, initialized } = useAuthStore()
  const { pathname } = useLocation()
  const params = useParams()
  const isNew = pathname === "/submissions/new"
  const id = Number(params.id)

  const [entries, setEntries] = useState<MineEntry[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const bump = () => setRetryKey((k) => k + 1)

  useEffect(() => {
    if (!initialized || !user) return
    let cancelled = false
    setEntries(null)
    setFetchError(null)
    listMine()
      .then((r) => { if (!cancelled) setEntries(r.submissions) })
      .catch(() => { if (!cancelled) setFetchError("Failed to load submissions.") })
    return () => { cancelled = true }
  }, [initialized, user, retryKey])

  const error = !initialized ? null : !user ? "Sign in to view your submissions." : fetchError
  const loading = entries === null && !fetchError

  let main: ReactNode
  if (!initialized) {
    main = <SubmissionShell title="My submissions" ready={false} />
  } else if (!user) {
    main = <SubmissionShell title="My submissions" error={error} />
  } else if (isNew) {
    main = <NewSubmissionForm bump={bump} />
  } else if (Number.isInteger(id)) {
    main = <EditSubmissionForm id={id} bump={bump} />
  } else {
    main = (
      <div className={styles.empty}>
        <Body2>Select a submission, or start a new one.</Body2>
      </div>
    )
  }

  const list = user ? (
    <>
      <NewSubmissionCard />
      <SubmissionList
        entries={entries ?? []}
        loading={loading}
        error={fetchError}
        emptyText="No pending submissions."
        renderRow={(e) => (
          <SubmissionRow
            entry={e}
            to={`/submissions/${e.id}`}
            selected={e.id === id}
          />
        )}
      />
    </>
  ) : null

  return (
    <>
      <Seo title="My submissions" description="Your building submissions." path="/submissions" />
      <SideBar>{list}</SideBar>
      {main}
    </>
  )
}

function NewSubmissionForm({ bump }: { bump: () => void }) {
  const navigate = useNavigate()
  const { user, initialized, signIn } = useAuthStore()
  const { form, saving, submit } = useSubmissionForm({
    onSubmit: async (payload) => {
      const { id } = await createSubmission(payload)
      toast.success("Submitted for review.")
      bump()
      navigate(`/submissions/${id}`)
    },
  })

  useEffect(() => {
    if (initialized && !user) void signIn()
  }, [initialized, user, signIn])

  const inFlight = form.formState.isSubmitting || saving

  return (
    <SubmissionShell
      title="Submit a building"
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
  )
}

function EditSubmissionForm({
  id,
  bump,
}: {
  id: number
  bump: () => void
}) {
  const { form, saving, submit } = useSubmissionForm({
    onSubmit: async (payload, values) => {
      await patchSubmission(id, payload)
      toast.success("Saved.")
      form.reset(values)
      bump()
    },
  })

  const [loadingEntry, setLoadingEntry] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!Number.isInteger(id)) return
    let cancelled = false
    setLoadingEntry(true)
    getSubmission(id)
      .then(({ submission }) => {
        if (cancelled) return
        form.reset(payloadToFormValues(submission.payload))
        setLoadError(false)
      })
      .catch(() => {
        if (cancelled) return
        else setLoadError(true)
      })
      .finally(() => { if (!cancelled) setLoadingEntry(false) })
    return () => { cancelled = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const error = loadError ? "Could not load this submission." : undefined

  return (
    <SubmissionShell
      title="My submission"
      lead="Edit your submission while it's pending."
      ready={!error && !loadingEntry}
      error={error}
      onSubmit={submit}
      actions={
        <div className={styles.createBar}>
          <Button type="submit" disabled={saving || !form.formState.isValid}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : "Save"}
          </Button>
        </div>
      }
    >
      <SubmissionFields form={form} />
    </SubmissionShell>
  )
}

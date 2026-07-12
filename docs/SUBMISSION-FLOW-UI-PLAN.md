# Submission Flow UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend for the architecture-submission flow — `/submit` (create), `/moderate` (queue), and `/moderate/:id` (review) — sharing one editable form, with role-gated nav.

**Architecture:** A single `<SubmissionForm>` runs in two modes (`create` / `review`) against the already-shipped worker API. State is `react-hook-form` + `@hookform/resolvers` (zod) on a form-values schema; a pure `shapePayload` assembles the wire `SubmissionPayload`. Review mode adds a `<DecisionBar>` (Explicit-Save-then-Decide). One pure module is unit-tested with vitest; the rest is typecheck + manual `verify`.

**Tech Stack:** React 19, react-router 7, react-hook-form, @hookform/resolvers, zod 4, `@nolli/ui` (Radix-based), sonner toasts, vitest. App: `apps/nolli`.

**Spec:** `docs/SUBMISSION-FLOW-DESIGN-UI.md` (commit `4325aa4`).

**Working dir:** the worktree `/home/zain_chen/kiyo-n-zane/nolli/.claude/worktrees/feat-submission-flow-ui`, branch `worktree-feat-submission-flow-ui`. Run all commands from here. `cd apps/nolli` for app-scoped commands.

**Conventions (do not violate):**
- Import UI types/helpers from the `@nolli/data` barrel (never worker-side). Worker boundary is irrelevant here — this is SPA only.
- Comments: sparse, match surrounding density, default to zero.
- No `Co-Authored-By` in commit messages.
- Typecheck (the `pnpm typecheck` script is a no-op): from `apps/nolli` run `npx tsc -p tsconfig.vite.json --noEmit`.
- Toasts: `import { toast } from "sonner"`.
- Existing patterns to mirror: `src/lib/api/favorites.ts` (client fetcher + `UnauthorizedError`), `src/pages/about/about.tsx` + `static-page-shell.tsx` (full-frame page), `src/components/layout/nav/index.tsx` (nav items).

---

## File map

**Create:**
- `apps/nolli/src/components/submission/shape-payload.ts` — pure form↔payload conversion + form-values schema/types. (+ `shape-payload.test.ts`)
- `apps/nolli/src/components/submission/coords-field.tsx` — latitude + longitude inputs.
- `apps/nolli/src/components/submission/photo-uploader.tsx` — dropzone-first photo strip.
- `apps/nolli/src/components/submission/decision-bar.tsx` — review-mode Save/Approve/Reject bar.
- `apps/nolli/src/components/submission/submission-form.tsx` — THE shared form.
- `apps/nolli/src/pages/submit/submit.tsx` — auth-gate shell + create form.
- `apps/nolli/src/pages/moderate/moderate.tsx` — role-gate shell + queue.
- `apps/nolli/src/pages/moderate/queue-card.tsx` — one queue card.
- `apps/nolli/src/pages/review/review.tsx` — role-gate shell + review form.
- `apps/nolli/vitest.config.ts` — vitest + path aliases.
- CSS modules alongside each `.tsx` above (as needed).

**Modify:**
- `apps/nolli/src/lib/api/submissions.ts` — add `getSubmission`, type `listQueue`.
- `apps/nolli/src/components/layout/nav/index.tsx` — auth/role-aware nav items.
- `apps/nolli/src/vite-app.tsx` — add three routes.
- `apps/nolli/package.json` — add deps + scripts.

---

## Task 0: Dependencies + vitest setup

**Files:**
- Modify: `apps/nolli/package.json`
- Create: `apps/nolli/vitest.config.ts`

- [ ] **Step 1: Add runtime + dev dependencies**

Run from the worktree root:

```bash
pnpm --filter nolli add react-hook-form @hookform/resolvers
pnpm --filter nolli add -D vitest
```

- [ ] **Step 2: Add test scripts to `apps/nolli/package.json`**

In the `"scripts"` object of `apps/nolli/package.json`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `apps/nolli/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@nolli/data": fileURLToPath(new URL("../../packages/data/src/index.ts", import.meta.url)),
      "@nolli/ui": fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
```

- [ ] **Step 4: Verify install + a no-op test run**

Run:
```bash
cd apps/nolli && pnpm test
```
Expected: vitest runs, reports "No test files found" (exit 0 or a no-tests message — acceptable, tests land in Task 1). If it errors on config, fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "deps: react-hook-form, @hookform/resolvers, vitest + test scripts"
```

---

## Task 1: Pure `shape-payload` module (TDD)

**Files:**
- Create: `apps/nolli/src/components/submission/shape-payload.ts`
- Test: `apps/nolli/src/components/submission/shape-payload.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/nolli/src/components/submission/shape-payload.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { submissionPayloadSchema } from "@nolli/data"
import { shapePayload, payloadToFormValues, type FormValues } from "./shape-payload"

const baseForm: FormValues = {
  metadata: {
    name: "Villa Savoye",
    architect: "Le Corbusier",
    year: 1931,
    address: "Poissy",
    city: "Poissy",
    country: "France",
    latitude: 48.9,
    longitude: 2.03,
    google_maps_url: "",
  },
  photos: [
    { staging_key: "k1", width: 1000, height: 800, caption: "front" },
    { staging_key: "k2", width: 500, height: 500, caption: "" },
  ],
  notes: [{ text: "Five points of architecture." }],
  links: [{ label: "Wiki", url: "https://en.wikipedia.org/wiki/Villa_Savoye" }],
}

describe("shapePayload", () => {
  it("marks every item action:'new' and sets id null", () => {
    const p = shapePayload(baseForm)
    expect(p.photos.every((ph) => ph.action === "new" && ph.id === null)).toBe(true)
    expect(p.notes.every((n) => n.action === "new" && n.id === null)).toBe(true)
    expect(p.links.every((l) => l.action === "new" && l.id === null)).toBe(true)
  })

  it("sets is_cover true only on the first photo", () => {
    const p = shapePayload(baseForm)
    expect(p.photos.map((ph) => ph.is_cover)).toEqual([true, false])
  })

  it("derives google_maps_url from name/city/country when blank", () => {
    const p = shapePayload(baseForm)
    expect(p.metadata.google_maps_url).toBe(
      "https://www.google.com/maps?q=Villa%20Savoye%2C%20Poissy%2C%20France",
    )
  })

  it("keeps an explicit google_maps_url", () => {
    const p = shapePayload({
      ...baseForm,
      metadata: { ...baseForm.metadata, google_maps_url: "https://maps.example/x" },
    })
    expect(p.metadata.google_maps_url).toBe("https://maps.example/x")
  })

  it("derives links sort_order from array index and types them custom", () => {
    const p = shapePayload({
      ...baseForm,
      links: [
        { label: "a", url: "https://a.example" },
        { label: "", url: "https://b.example" },
      ],
    })
    expect(p.links.map((l) => l.sort_order)).toEqual([0, 1])
    expect(p.links.every((l) => l.type === "custom")).toBe(true)
    expect(p.links[1].label).toBe(null) // blank label → null
  })

  it("round-trips through submissionPayloadSchema", () => {
    const p = shapePayload(baseForm)
    expect(() => submissionPayloadSchema.parse(p)).not.toThrow()
  })

  it("payloadToFormValues inverts shapePayload", () => {
    const round = payloadToFormValues(shapePayload(baseForm))
    expect(round.metadata.name).toBe("Villa Savoye")
    expect(round.photos).toHaveLength(2)
    expect(round.photos[0].staging_key).toBe("k1")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/nolli && pnpm test
```
Expected: FAIL — `Cannot find module './shape-payload'`.

- [ ] **Step 3: Write the implementation**

Create `apps/nolli/src/components/submission/shape-payload.ts`:

```ts
import { z } from "zod"
import { buildGoogleMapsUrl, type SubmissionPayload } from "@nolli/data"

export const formValuesSchema = z.object({
  metadata: z.object({
    name: z.string().min(1),
    architect: z.string().min(1),
    year: z.number(),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    google_maps_url: z.string().url().or(z.literal("")),
  }),
  photos: z
    .array(
      z.object({
        staging_key: z.string(),
        width: z.number().int(),
        height: z.number().int(),
        caption: z.string(),
      }),
    )
    .min(1),
  notes: z.array(z.object({ text: z.string().min(1) })),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })),
})

export type FormValues = z.infer<typeof formValuesSchema>

export function shapePayload(v: FormValues): SubmissionPayload {
  const explicit = v.metadata.google_maps_url.trim()
  const google_maps_url =
    explicit.length > 0
      ? explicit
      : buildGoogleMapsUrl({
          name: v.metadata.name,
          city: v.metadata.city,
          country: v.metadata.country,
        })

  return {
    metadata: { ...v.metadata, google_maps_url },
    photos: v.photos.map((p, i) => ({
      id: null,
      staging_key: p.staging_key,
      caption: p.caption ?? null,
      is_cover: i === 0,
      width: p.width,
      height: p.height,
      action: "new",
    })),
    notes: v.notes.map((n) => ({ id: null, text: n.text, action: "new" })),
    links: v.links.map((l, i) => ({
      id: null,
      type: "custom",
      url: l.url,
      label: l.label.trim().length > 0 ? l.label : null,
      sort_order: i,
      action: "new",
    })),
  }
}

export function payloadToFormValues(p: SubmissionPayload): FormValues {
  return {
    metadata: {
      name: p.metadata.name,
      architect: p.metadata.architect,
      year: p.metadata.year,
      address: p.metadata.address,
      city: p.metadata.city,
      country: p.metadata.country,
      latitude: p.metadata.latitude,
      longitude: p.metadata.longitude,
      google_maps_url: p.metadata.google_maps_url,
    },
    photos: p.photos.map((ph) => ({
      staging_key: ph.staging_key,
      width: ph.width,
      height: ph.height,
      caption: ph.caption ?? "",
    })),
    notes: p.notes.map((n) => ({ text: n.text })),
    links: p.links.map((l) => ({ label: l.label ?? "", url: l.url })),
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd apps/nolli && pnpm test
```
Expected: PASS — all `shapePayload` tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/nolli/src/components/submission/shape-payload.ts apps/nolli/src/components/submission/shape-payload.test.ts
git commit -m "feat(submit): pure form↔payload shaping + tests"
```

---

## Task 2: API client additions

**Files:**
- Modify: `apps/nolli/src/lib/api/submissions.ts`

- [ ] **Step 1: Add `getSubmission` and type `listQueue`**

In `apps/nolli/src/lib/api/submissions.ts`, add this import at the top (merge with the existing import line):

```ts
import type { SubmissionPayload, SubmissionStatus } from "@nolli/data"
```

Replace the existing `listQueue` function (the one returning `{ submissions: unknown[] }`) with:

```ts
export type QueueEntry = {
  id: number
  name: string
  architect: string
  city: string
  submitter_name: string | null
  created_at: string
}

/** GET /api/submissions — moderator queue (pending only). */
export async function listQueue(): Promise<{ submissions: QueueEntry[] }> {
  const resp = await fetch("/api/submissions", { credentials: "same-origin" })
  return unwrap(resp)
}
```

Add a new `SubmissionRow` type and `getSubmission` function (place after `listMine`):

```ts
export type SubmissionRow = {
  id: number
  architecture_id: string | null
  submitter_id: number
  status: SubmissionStatus
  payload: SubmissionPayload
  created_at: string
  reviewed_at: string | null
  submitter_name: string | null
}

/** GET /api/submissions/:id — one submission (moderator+, or the owner). */
export async function getSubmission(id: number): Promise<{ submission: SubmissionRow }> {
  const resp = await fetch(`/api/submissions/${id}`, { credentials: "same-origin" })
  return unwrap(resp)
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/nolli/src/lib/api/submissions.ts
git commit -m "feat(api): typed getSubmission + listQueue for submissions"
```

---

## Task 3: `<CoordsField>`

**Files:**
- Create: `apps/nolli/src/components/submission/coords-field.tsx`
- Create: `apps/nolli/src/components/submission/coords-field.module.css`

- [ ] **Step 1: Create the component**

`apps/nolli/src/components/submission/coords-field.tsx`:

```tsx
import type { UseFormRegister, FieldErrors } from "react-hook-form"
import { InputGroup, InputGroupText, Input } from "@nolli/ui"
import { Body3 } from "@nolli/ui"
import styles from "./coords-field.module.css"

export function CoordsField({
  register,
  errors,
}: {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <InputGroup>
          <InputGroupText>lat</InputGroupText>
          <Input
            type="number"
            step="any"
            placeholder="48.9242"
            {...register("metadata.latitude", { valueAsNumber: true })}
          />
        </InputGroup>
        <InputGroup>
          <InputGroupText>lng</InputGroupText>
          <Input
            type="number"
            step="any"
            placeholder="2.0301"
            {...register("metadata.longitude", { valueAsNumber: true })}
          />
        </InputGroup>
      </div>
      {(errors.metadata?.latitude || errors.metadata?.longitude) && (
        <Body3 className={styles.error}>Enter both latitude and longitude.</Body3>
      )}
      <Body3 className={styles.help}>
        Open Google Maps → right-click the exact spot → click the lat,lng that appears → paste each here.
      </Body3>
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS module**

`apps/nolli/src/components/submission/coords-field.module.css`:

```css
.wrap { display: flex; flex-direction: column; gap: 0.4rem; }
.row { display: flex; gap: 0.6rem; }
.error { color: rgb(var(--color-destructive)); }
.help { color: rgb(var(--color-muted-foreground)); }
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors. (`UseFormRegister<any>` is intentional here to keep the field component decoupled from the full form type; the form owns the real typing.)

- [ ] **Step 4: Commit**

```bash
git add apps/nolli/src/components/submission/coords-field.tsx apps/nolli/src/components/submission/coords-field.module.css
git commit -m "feat(submit): coords input (latitude + longitude)"
```

---

## Task 4: `<PhotoUploader>`

**Files:**
- Create: `apps/nolli/src/components/submission/photo-uploader.tsx`
- Create: `apps/nolli/src/components/submission/photo-uploader.module.css`

- [ ] **Step 1: Create the component**

`apps/nolli/src/components/submission/photo-uploader.tsx`:

```tsx
import { useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Loader2, X } from "lucide-react"
import { uploadImage, UnauthorizedError } from "@/lib/api/submissions"
import { toast } from "sonner"
import { Caption } from "@nolli/ui"
import type { FormValues } from "./shape-payload"
import styles from "./photo-uploader.module.css"

const STAGING_BASE = import.meta.env.VITE_R2_PUBLIC_STAGING_URL ?? ""

export function PhotoUploader({ form }: { form: UseFormReturn<FormValues> }) {
  const { fields, append, remove } = form.useFieldArray({ name: "photos" })
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const bitmap = await createImageBitmap(file)
        const { staging_key } = await uploadImage(file)
        append({
          staging_key,
          width: bitmap.width,
          height: bitmap.height,
          caption: "",
        })
        bitmap.close()
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast.error("Session expired — please sign in again.")
      } else {
        toast.error("Upload failed. Try a smaller or different image.")
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={styles.strip}>
      <button
        type="button"
        className={styles.dropzone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
      >
        {uploading ? <Loader2 size={20} className={styles.spin} /> : <span>＋ Add photo</span>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </button>

      {fields.map((f, i) => (
        <div key={f.id} className={styles.thumb}>
          <img
            src={`${STAGING_BASE}/${f.staging_key}`}
            alt=""
            className={styles.img}
            loading="lazy"
          />
          {i === 0 && <span className={styles.cover}>cover</span>}
          <button
            type="button"
            className={styles.remove}
            onClick={() => remove(i)}
            aria-label="Remove photo"
          >
            <X size={14} />
          </button>
          <input
            className={styles.caption}
            placeholder="Caption"
            {...form.register(`photos.${i}.caption`)}
          />
        </div>
      ))}
      {fields.length === 0 && (
        <Caption className={styles.hint}>At least one photo is required.</Caption>
      )}
    </div>
  )
}
```

> Note on `form.useFieldArray`: react-hook-form's `UseFormReturn<T>` exposes `useFieldArray` as a method on the returned object, so calling `form.useFieldArray(...)` is valid. Alternatively destructure at the call site — both compile.

- [ ] **Step 2: Create the CSS module**

`apps/nolli/src/components/submission/photo-uploader.module.css`:

```css
.strip { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.4rem; }
.dropzone {
  flex: 0 0 7rem; height: 7rem;
  display: grid; place-items: center;
  border: 1px dashed rgb(var(--color-secondary-foreground) / .4);
  border-radius: var(--size-border-radius);
  background: rgb(var(--color-secondary-background));
  color: rgb(var(--color-muted-foreground));
  cursor: pointer;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.thumb { position: relative; flex: 0 0 7rem; height: 7rem; border-radius: var(--size-border-radius); overflow: hidden; }
.img { width: 100%; height: 100%; object-fit: cover; }
.cover { position: absolute; top: 4px; left: 4px; font-size: 10px; background: rgb(0 0 0 / .6); color: #fff; padding: 1px 5px; border-radius: 999px; }
.remove { position: absolute; top: 4px; right: 4px; background: rgb(0 0 0 / .6); color: #fff; border: none; border-radius: 999px; width: 20px; height: 20px; display: grid; place-items: center; cursor: pointer; }
.caption { position: absolute; bottom: 0; width: 100%; border: none; background: rgb(0 0 0 / .5); color: #fff; font-size: 11px; padding: 2px 4px; }
.hint { align-self: center; color: rgb(var(--color-muted-foreground)); }
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors. (If `UseFormReturn<FormValues>` does not expose `useFieldArray` in this RHF version, destructure instead: `const { fields, append, remove } = useFieldArray({ control: form.control, name: "photos" })` and import `useFieldArray` from `react-hook-form`.)

- [ ] **Step 4: Commit**

```bash
git add apps/nolli/src/components/submission/photo-uploader.tsx apps/nolli/src/components/submission/photo-uploader.module.css
git commit -m "feat(submit): photo uploader (dropzone-first strip)"
```

---

## Task 5: `<DecisionBar>`

**Files:**
- Create: `apps/nolli/src/components/submission/decision-bar.tsx`
- Create: `apps/nolli/src/components/submission/decision-bar.module.css`

- [ ] **Step 1: Create the component**

`apps/nolli/src/components/submission/decision-bar.tsx`:

```tsx
import { useState } from "react"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input } from "@nolli/ui"

export function DecisionBar({
  dirty,
  saving,
  deciding,
  onSave,
  onDecide,
}: {
  dirty: boolean
  saving: boolean
  deciding: boolean
  onSave: () => void
  onDecide: (decision: "approve" | "reject", note: string) => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState("")

  return (
    <div className={styles.bar}>
      <Button type="button" variant="outline" onClick={onSave} disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>

      <div className={styles.decisions}>
        <Button
          type="button"
          onClick={() => onDecide("approve", "")}
          disabled={dirty || deciding}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={dirty || deciding}
        >
          Reject
        </Button>
      </div>

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
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS module**

`apps/nolli/src/components/submission/decision-bar.module.css`:

```css
.bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.decisions { display: flex; gap: 0.5rem; }
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors. (Verify `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` match the exports from `@nolli/ui` shown in Task-prep — they do.)

- [ ] **Step 4: Commit**

```bash
git add apps/nolli/src/components/submission/decision-bar.tsx apps/nolli/src/components/submission/decision-bar.module.css
git commit -m "feat(submit): review decision bar (Save / Approve / Reject)"
```

---

## Task 6: `<SubmissionForm>` (the shared form)

**Files:**
- Create: `apps/nolli/src/components/submission/submission-form.tsx`
- Create: `apps/nolli/src/components/submission/submission-form.module.css`

- [ ] **Step 1: Create the component**

`apps/nolli/src/components/submission/submission-form.tsx`:

```tsx
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Input, InputGroup, InputGroupText, Button, Body3, Caption } from "@nolli/ui"
import { slugify } from "@nolli/data"
import {
  createSubmission,
  patchSubmission,
  decideSubmission,
  getSubmission,
  UnauthorizedError,
} from "@/lib/api/submissions"
import { useAuthStore } from "@/stores/auth"
import { CoordsField } from "./coords-field"
import { PhotoUploader } from "./photo-uploader"
import { DecisionBar } from "./decision-bar"
import { formValuesSchema, shapePayload, payloadToFormValues, type FormValues } from "./shape-payload"
import styles from "./submission-form.module.css"

const EMPTY: FormValues = {
  metadata: {
    name: "", architect: "", year: NaN, address: "", city: "", country: "",
    latitude: NaN, longitude: NaN, google_maps_url: "",
  },
  photos: [],
  notes: [],
  links: [],
}

export function SubmissionForm({ mode, id }: { mode: "create" | "review"; id?: number }) {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const [loadingReview, setLoadingReview] = useState(mode === "review")
  const [saving, setSaving] = useState(false)
  const [deciding, setDeciding] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formValuesSchema),
    defaultValues: EMPTY,
  })

  const isReview = mode === "review"

  // Review mode: load the existing payload once, then reset the form with it.
  useEffect(() => {
    if (!isReview || id == null) return
    let cancelled = false
    getSubmission(id)
      .then(({ submission }) => {
        if (!cancelled) form.reset(payloadToFormValues(submission.payload))
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) void signIn()
        else toast.error("Could not load this submission.")
      })
      .finally(() => {
        if (!cancelled) setLoadingReview(false)
      })
    return () => {
      cancelled = true
    }
  }, [isReview, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isReview && loadingReview) return <Body3>Loading…</Body3>

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const payload = shapePayload(values)
      if (isReview) {
        await patchSubmission(id!, payload)
        toast.success("Saved.")
        form.reset(values)
      } else {
        await createSubmission(payload)
        toast.success("Submitted for review.")
        form.reset(EMPTY)
      }
    } catch (err) {
      handleError(err, signIn)
    } finally {
      setSaving(false)
    }
  })

  async function onDecide(decision: "approve" | "reject", note: string) {
    setDeciding(true)
    try {
      await decideSubmission(id!, decision, note)
      toast.success(decision === "approve" ? "Approved." : "Rejected.")
      navigate("/moderate")
    } catch (err) {
      handleError(err, signIn)
    } finally {
      setDeciding(false)
    }
  }

  const name = form.watch("metadata.name")

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <section className={styles.section}>
        <label className={styles.field}>
          <span>Name</span>
          <Input {...form.register("metadata.name")} />
          {name && <Caption className={styles.slug}>slug: {slugify(name)}</Caption>}
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Architect</span>
            <Input {...form.register("metadata.architect")} />
          </label>
          <label className={styles.field}>
            <span>Year</span>
            <Input type="number" {...form.register("metadata.year", { valueAsNumber: true })} />
          </label>
        </div>
        <label className={styles.field}>
          <span>Address</span>
          <Input {...form.register("metadata.address")} />
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>City</span>
            <Input {...form.register("metadata.city")} />
          </label>
          <label className={styles.field}>
            <span>Country</span>
            <Input {...form.register("metadata.country")} />
          </label>
        </div>

        <label className={styles.field}>
          <span>Coordinates</span>
          <CoordsField register={form.register} errors={form.formState.errors} />
        </label>

        <label className={styles.field}>
          <span>Google Maps URL</span>
          <Input
            placeholder={mapsPlaceholder(form.watch())}
            {...form.register("metadata.google_maps_url")}
          />
        </label>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Photos</span>
        <PhotoUploader form={form} />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Notes</span>
        <NotesField form={form} />
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Links</span>
        <LinksField form={form} />
      </section>

      {isReview ? (
        <DecisionBar
          dirty={form.formState.isDirty}
          saving={saving}
          deciding={deciding}
          onSave={onSubmit}
          onDecide={onDecide}
        />
      ) : (
        <Button type="submit" disabled={form.formState.isSubmitting || saving}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      )}
    </form>
  )
}

function NotesField({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { fields, append, remove } = form.useFieldArray({ name: "notes" })
  return (
    <div className={styles.stack}>
      {fields.map((f, i) => (
        <div key={f.id} className={styles.row}>
          <textarea
            className={styles.textarea}
            placeholder="Note"
            {...form.register(`notes.${i}.text`)}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}>
        ＋ Add note
      </Button>
    </div>
  )
}

function LinksField({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { fields, append, remove } = form.useFieldArray({ name: "links" })
  return (
    <div className={styles.stack}>
      {fields.map((f, i) => (
        <div key={f.id} className={styles.grid2}>
          <Input placeholder="Label" {...form.register(`links.${i}.label`)} />
          <InputGroup>
            <InputGroupText>url</InputGroupText>
            <input
              className={styles.linkInput}
              placeholder="https://"
              {...form.register(`links.${i}.url`)}
            />
          </InputGroup>
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ label: "", url: "" })}
      >
        ＋ Add link
      </Button>
    </div>
  )
}

function mapsPlaceholder(v: FormValues): string {
  if (v.metadata.name && v.metadata.city && v.metadata.country) {
    return `https://www.google.com/maps?q=${v.metadata.name}, ${v.metadata.city}, ${v.metadata.country}`
  }
  return "Auto-filled from name, city, country"
}

function handleError(err: unknown, signIn: () => Promise<void>) {
  if (err instanceof UnauthorizedError) {
    toast.error("Session expired — signing in again.")
    void signIn()
  } else {
    toast.error("Something went wrong. Please try again.")
  }
}
```

- [ ] **Step 2: Create the CSS module**

`apps/nolli/src/components/submission/submission-form.module.css`:

```css
.form { display: flex; flex-direction: column; gap: 1.4rem; max-width: 36rem; }
.section { display: flex; flex-direction: column; gap: 0.6rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field > span, .label { font-size: 0.85rem; color: rgb(var(--color-muted-foreground)); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; align-items: center; }
.stack { display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; gap: 0.5rem; align-items: flex-end; }
.textarea { width: 100%; min-height: 4rem; resize: vertical; padding: 0.4rem 0.5rem; border-radius: var(--size-border-radius); background: rgb(var(--color-secondary-background)); border: 1px solid rgb(var(--color-secondary-foreground) / .2); color: inherit; }
.linkInput { flex: 1; }
.slug { color: rgb(var(--color-muted-foreground)); }
```

- [ ] **Step 3: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors. Likely fixes if errors appear:
- If `form.useFieldArray` isn't typed, switch to `import { useFieldArray } from "react-hook-form"` and call `useFieldArray({ control: form.control, name: "..." })`.
- `form.watch()` with no args returns the whole values object — confirm `mapsPlaceholder(form.watch())` receives `FormValues`.

- [ ] **Step 4: Commit**

```bash
git add apps/nolli/src/components/submission/submission-form.tsx apps/nolli/src/components/submission/submission-form.module.css
git commit -m "feat(submit): shared SubmissionForm (create + review modes)"
```

---

## Task 7: `/submit` page

**Files:**
- Create: `apps/nolli/src/pages/submit/submit.tsx`

- [ ] **Step 1: Create the page**

`apps/nolli/src/pages/submit/submit.tsx`:

```tsx
import { useEffect } from "react"
import { Seo } from "@/components/layout/seo"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { SubmissionForm } from "@/components/submission/submission-form"
import { H3 } from "@nolli/ui"
import { useAuthStore } from "@/stores/auth"

export function SubmitPage() {
  const { user, initialized, signIn } = useAuthStore()

  useEffect(() => {
    if (initialized && !user) void signIn()
  }, [initialized, user, signIn])

  if (!initialized) return <StaticPageShell title="Submit">Loading…</StaticPageShell>
  if (!user) return <StaticPageShell title="Submit">Redirecting to sign in…</StaticPageShell>

  return (
    <>
      <Seo title="Submit a building" description="Suggest a new building for the Nolli map." path="/submit" />
      <StaticPageShell title="Submit a building" lead="Suggest a new building for the map.">
        <Section>
          <H3>Details</H3>
          <SubmissionForm mode="create" />
        </Section>
      </StaticPageShell>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/nolli/src/pages/submit/submit.tsx
git commit -m "feat(submit): /submit page (auth-gated create form)"
```

---

## Task 8: `/moderate` queue page + `<QueueCard>`

**Files:**
- Create: `apps/nolli/src/pages/moderate/queue-card.tsx`
- Create: `apps/nolli/src/pages/moderate/queue-card.module.css`
- Create: `apps/nolli/src/pages/moderate/moderate.tsx`

- [ ] **Step 1: Create the queue card**

`apps/nolli/src/pages/moderate/queue-card.tsx`:

```tsx
import { Link } from "react-router"
import { Card } from "@nolli/ui"
import type { QueueEntry } from "@/lib/api/submissions"
import styles from "./queue-card.module.css"

export function QueueCard({ entry }: { entry: QueueEntry }) {
  return (
    <Link to={`/moderate/${entry.id}`} className={styles.link}>
      <Card className={styles.card}>
        <div className={styles.title}>{entry.name}</div>
        <div className={styles.meta}>
          {entry.architect} · {entry.city}
        </div>
        <div className={styles.foot}>
          {entry.submitter_name ?? "anonymous"} · {new Date(entry.created_at).toLocaleDateString()}
        </div>
      </Card>
    </Link>
  )
}
```

> If `@nolli/ui` does not export `Card`, replace `<Card>` with `<div className={styles.card}>` and drop the import. (Check the index exports — `Card` is not in the known export list, so prefer the `<div>` fallback.) **Use the `<div>` fallback to be safe.**

- [ ] **Step 2: Create the card CSS**

`apps/nolli/src/pages/moderate/queue-card.module.css`:

```css
.link { text-decoration: none; color: inherit; }
.card { padding: 0.9rem 1rem; border-radius: var(--size-border-radius); background: rgb(var(--color-secondary-background)); display: flex; flex-direction: column; gap: 0.2rem; }
.title { font-weight: 600; }
.meta { color: rgb(var(--color-muted-foreground)); font-size: 0.9rem; }
.foot { color: rgb(var(--color-muted-foreground)); font-size: 0.8rem; }
```

- [ ] **Step 3: Create the queue page**

`apps/nolli/src/pages/moderate/moderate.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Seo } from "@/components/layout/seo"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { Body2, Button, H3 } from "@nolli/ui"
import { useAuthStore } from "@/stores/auth"
import { listQueue, type QueueEntry } from "@/lib/api/submissions"
import { QueueCard } from "./queue-card"

export function ModeratePage() {
  const { user, initialized } = useAuthStore()
  const isMod = user?.role === "moderator" || user?.role === "admin"
  const [entries, setEntries] = useState<QueueEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!initialized || !isMod) return
    let cancelled = false
    listQueue()
      .then((r) => { if (!cancelled) setEntries(r.submissions) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [initialized, isMod])

  if (!initialized) return <StaticPageShell title="Moderate">Loading…</StaticPageShell>
  if (!isMod) return <StaticPageShell title="Moderate"><Body2>Not available.</Body2></StaticPageShell>

  let content
  if (error) {
    content = (<>
      <Body2>Could not load the queue.</Body2>
      <Button variant="outline" onClick={() => { setError(false); setEntries(null) }}>Retry</Button>
    </>)
  } else if (entries === null) {
    content = <Body2>Loading…</Body2>
  } else if (entries.length === 0) {
    content = <Body2>Nothing to review.</Body2>
  } else {
    content = entries.map((e) => <QueueCard key={e.id} entry={e} />)
  }

  return (
    <>
      <Seo title="Moderate" description="Review building submissions." path="/moderate" />
      <StaticPageShell title="Moderation queue">
        <Section>
          <H3>Pending</H3>
          {content}
        </Section>
      </StaticPageShell>
    </>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/nolli/src/pages/moderate/
git commit -m "feat(submit): /moderate queue page + queue card"
```

---

## Task 9: `/moderate/:id` review page

**Files:**
- Create: `apps/nolli/src/pages/review/review.tsx`

- [ ] **Step 1: Create the page**

`apps/nolli/src/pages/review/review.tsx`:

```tsx
import { Seo } from "@/components/layout/seo"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { Body2, H3 } from "@nolli/ui"
import { useAuthStore } from "@/stores/auth"
import { useParams } from "react-router"
import { SubmissionForm } from "@/components/submission/submission-form"

export function ReviewPage() {
  const { user, initialized } = useAuthStore()
  const isMod = user?.role === "moderator" || user?.role === "admin"
  const params = useParams()
  const id = Number(params.id)

  if (!initialized) return <StaticPageShell title="Review">Loading…</StaticPageShell>
  if (!isMod) return <StaticPageShell title="Review"><Body2>Not available.</Body2></StaticPageShell>
  if (!Number.isInteger(id)) return <StaticPageShell title="Review"><Body2>Invalid submission.</Body2></StaticPageShell>

  return (
    <>
      <Seo title="Review submission" description="Review a building submission." path={`/moderate/${id}`} />
      <StaticPageShell title="Review submission">
        <Section>
          <H3>Edit & decide</H3>
          <SubmissionForm mode="review" id={id} />
        </Section>
      </StaticPageShell>
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/nolli/src/pages/review/review.tsx
git commit -m "feat(submit): /moderate/:id review page"
```

---

## Task 10: Role/auth-aware nav

**Files:**
- Modify: `apps/nolli/src/components/layout/nav/index.tsx`

- [ ] **Step 1: Make nav items auth/role-aware**

In `apps/nolli/src/components/layout/nav/index.tsx`:

1. Add imports at the top:
```tsx
import { Shield } from "lucide-react"
import { useAuthStore } from "@/stores/auth"
```

2. Replace the static `navItems` array (the `const navItems: NavItem[] = [...]` block) with nothing at module scope, and instead derive items inside both `Rail()` and `Drawer()`:
```tsx
const user = useAuthStore((s) => s.user)
const items: NavItem[] = [
  { icon: Home, label: "Map", path: "/", disabled: false },
  { icon: Star, label: "Favorites", path: "/favorite", disabled: false },
  ...(user ? [{ icon: Plus, label: "Submit", path: "/submit", disabled: false }] : []),
  ...((user?.role === "moderator" || user?.role === "admin")
    ? [{ icon: Shield, label: "Moderate", path: "/moderate", disabled: false }]
    : []),
  { icon: Info, label: "About", path: "/about", disabled: false },
]
```

3. In `Rail()`, rename the two `navItems.map(...)` references to `items.map(...)` (there is one in `Rail` and one in `Drawer`). Each `.map` currently reads `navItems.map` — change both to `items.map`.

4. The old `Plus` "Submit (Coming Soon)" disabled entry is gone; `Plus` is now reused for the enabled Submit item. The existing `import { Home, Star, Plus, Info } from "lucide-react"` stays; add `Shield` to it.

- [ ] **Step 2: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/nolli/src/components/layout/nav/index.tsx
git commit -m "feat(submit): auth/role-gated nav (Submit + Moderate)"
```

---

## Task 11: Wire routes

**Files:**
- Modify: `apps/nolli/src/vite-app.tsx`

- [ ] **Step 1: Add the three routes**

In `apps/nolli/src/vite-app.tsx`, add imports near the other page imports:

```tsx
import { SubmitPage } from "@/pages/submit/submit"
import { ModeratePage } from "@/pages/moderate/moderate"
import { ReviewPage } from "@/pages/review/review"
```

Inside `<Routes>`, add (before the catch-all `/*` route):

```tsx
<Route path="/submit" element={<SubmitPage />} />
<Route path="/moderate" element={<ModeratePage />} />
<Route path="/moderate/:id" element={<ReviewPage />} />
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/nolli/src/vite-app.tsx
git commit -m "feat(submit): route /submit, /moderate, /moderate/:id"
```

---

## Task 12: Verify

- [ ] **Step 1: Unit tests**

```bash
cd apps/nolli && pnpm test
```
Expected: all `shape-payload` tests pass.

- [ ] **Step 2: UI typecheck**

```bash
cd apps/nolli && npx tsc -p tsconfig.vite.json --noEmit
```
Expected: no errors.

- [ ] **Step 3: Worker + data typechecks (regression — no worker code changed, but confirm the barrel still resolves)**

```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
cd ../../packages/data && npx tsc -p tsconfig.json --noEmit
```
Expected: no errors.

- [ ] **Step 4: Manual end-to-end via the `verify` skill**

Operator prerequisites to confirm with the user before running:
- Staging R2 bucket public-readable; `VITE_R2_PUBLIC_STAGING_URL` set in the dev env.
- A dev user promoted to `moderator`.

Drive the flow:
1. Sign in as a normal user → nav shows **Submit** (no Moderate).
2. `/submit` → fill all fields, paste two lat/lng numbers, drop ≥1 photo (confirm thumbnail + cover tag render), add a note + link → **Submit** → toast "Submitted for review."
3. Promote to moderator (or sign in as one) → nav now shows **Moderate**.
4. `/moderate` → the submission appears as a card → click → `/moderate/:id`.
5. Review form is prefilled and editable. Edit a field → **Save changes** enabled (Approve/Reject disabled). Save → "Saved.", dirty clears → Approve/Reject enable.
6. **Approve** → toast → routed back to `/moderate`, card gone.
7. Repeat 4–5 on another submission, **Reject** with a note → confirm dialog → routed back.

If all pass, the feature is done.

---

## Notes for the executor

- **`form.useFieldArray` vs `useFieldArray({ control })`:** react-hook-form's `UseFormReturn` includes `useFieldArray` as a bound method in recent versions. If the installed version's types reject `form.useFieldArray`, switch every call site to `useFieldArray({ control: form.control, name: "..." })` with `useFieldArray` imported from `react-hook-form`. Both are correct; pick whichever typechecks.
- **`Card` from `@nolli/ui`:** not in the known export list — use the `<div>` fallback in `QueueCard` (Task 8 already defaults to it).
- **`Number.NaN` defaults:** `EMPTY.metadata.year/latitude/longitude` are `NaN` so number inputs render empty and `z.number()` validation fails until the user enters a value — this enforces "required" without extra code.
- **Staging image URL:** `${import.meta.env.VITE_R2_PUBLIC_STAGING_URL}/${staging_key}`. If the env var is unset in dev, thumbnails won't render but uploads still succeed — flag the missing prereq, don't block.

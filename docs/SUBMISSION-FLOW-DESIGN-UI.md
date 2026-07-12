# Architecture submission flow — UI design

- **Date:** 2026-07-11
- **Status:** Approved
- **Issue:** [czl9707/nolli#4](https://github.com/czl9707/nolli/issues/4) — Plan 2 (Frontend)
- **Builds on:** backend shipped in PR #74 (commit `9dd15d1`); design spec `docs/SUBMISSION-FLOW-DESIGN.md` (commit `f67a581`, branch `docs/submission-flow-design`).

## Goal

Let an authenticated user submit a new architecture (with images), and let moderators review a queue and approve/reject. This is the **UI** phase only — the worker API, schema, and `submissions` table are already live.

## Scope (this session)

Three pages:

- `/submit` — submission form (create mode).
- `/moderate` — moderator queue.
- `/moderate/:id` — review a single submission (review mode).

Plus nav wiring + role-gated rendering. No submitter-facing "My submissions" page this session (the `GET /mine` endpoint exists; a dedicated page is deferred).

## Core design decision: one shared form, two modes

The spec originally proposed a read-only `@nolli/board` preview for `/moderate/:id`. **Replaced** with a shared, editable form. `/submit` and `/moderate/:id` render the **same** `<SubmissionForm>` component in two modes — so a moderator sees the same form the submitter filled in, can fix typos inline, then decides. This also positions the form for a future owner-edit flow with only the action bar swapped.

| | `create` (`/submit`) | `review` (`/moderate/:id`) |
|---|---|---|
| Initial values | empty | fetched via `getSubmission(id)` |
| Primary button | **Submit** → `createSubmission` | **Save changes** → `patchSubmission` (disabled when `!isDirty`) |
| Decision bar | absent | `<DecisionBar>`: Approve / Reject (disabled while `isDirty`) |
| Post-submit | toast "pending review", reset | Save → toast; Approve/Reject → route to `/moderate` |

**Decision/edit interaction:** the `POST /decision` endpoint takes only `{ decision, note }` — no payload. So field edits must be `PATCH`-ed first. Model is **Explicit Save, then Decide**: a separate **Save changes** button persists edits; **Approve** and **Reject** are disabled while the form is dirty, so a moderator can never decide an unpersisted state.

## Form-state management

`react-hook-form` + `@hookform/resolvers` (zod), wired to the existing `submissionPayloadSchema`. `useFieldArray` drives the repeatable photos / notes / links sections; `formState.isDirty` drives the Save/Decide gating. Two new deps (small, maintained).

## Schema note (stricter than the spec draft)

The shipped `submissionMetadataSchema` (`packages/data/src/submissions.type.ts`) requires:
- `name`, `architect`, `city`, `country` — `z.string().min(1)`
- `year` — `z.number().int()` (required, not nullable)
- `address` — `z.string()` (required)
- `latitude` / `longitude` — `z.number()`
- `google_maps_url` — `z.string().url()` (**required**, not nullable)

`photos` ≥ 1 (`.min(1)`), each `{ id: null, staging_key, caption, is_cover, width, height, action: "new" }`. `notes` and `links` arrays; every item `action: "new"`. The form must satisfy all of the above.

## Routing & file structure

New routes in `apps/nolli/src/vite-app.tsx`:

- `/submit` → `<SubmitPage />`
- `/moderate` → `<ModeratePage />`
- `/moderate/:id` → `<ReviewPage />`

Full-frame pages (no sidebar board), like `/about`.

```
apps/nolli/src/pages/submit/
  submit.tsx                  ← auth-gate shell + <SubmissionForm mode="create" />
apps/nolli/src/pages/moderate/
  moderate.tsx                ← role-gate shell + queue
  queue-card.tsx              ← one submission card
apps/nolli/src/pages/review/
  review.tsx                  ← role-gate shell + <SubmissionForm mode="review" id={id} />
apps/nolli/src/components/submission/
  submission-form.tsx         ← THE shared form (create + review)
  photo-uploader.tsx          ← dropzone-first horizontal strip
  coords-field.tsx            ← latitude + longitude inputs
  decision-bar.tsx            ← review-mode action bar (Save / Approve / Reject)
  shape-payload.ts            ← pure: form values → SubmissionPayload (+ tests)
```

`decision-bar.tsx` is its own component so the form is unchanged when a future owner-edit flow reuses it with a different action set.

## Auth / role gating

In the page shells, reading `useAuthStore` (`user`, `initialized`, `signIn`):

- `/submit`: while `!initialized` → skeleton; if no `user` → call `signIn()` (Google redirect with return-to; reuses existing `signIn` → `/auth/login/google`). No unauth view.
- `/moderate`, `/moderate/:id`: while `!initialized` → skeleton; if `user.role` not in `{moderator, admin}` → a "not available" empty state. No sensitive data renders before the gate resolves.

## Nav wiring (`components/layout/nav/index.tsx`)

- Flip the existing "Submit (Coming Soon)" item to **enabled** for authed users (`Submit`, `/submit`, `Plus` icon). Hidden when unauthed (no dead button for anonymous).
- Add a **Moderate** nav item (`Shield` icon, `/moderate`), rendered only when `user.role ∈ {moderator, admin}`.

## `<SubmissionForm>` field sections

1. **Metadata** — `name`, `architect`, `year` (int), `address`, `city`, `country`. Free-text inputs (no autocomplete). A read-only live `slugify(name)` preview sits next to `name`.
2. **Coordinates** — `<CoordsField>`: two separate inputs, `latitude` and `longitude` (each a number). Inline help card: *"Open Google Maps → right-click the exact spot → click the lat,lng → paste here."* (No click-to-drop mini-map in v1.)
3. **Photos** — `<PhotoUploader>`: horizontal strip where **position 0 is always the dropzone** (click *or* drag-drop; multi-file drop loops `uploadImage`). Thumbnails follow in upload order; **the first thumbnail is the cover** (a small "cover" tag marks it). New uploads append so the cover stays stable. Each thumb has a caption field and a remove button. `useFieldArray` row `{ staging_key, width, height, caption, is_cover, action: "new" }`. Note: `uploadImage` returns only `{ staging_key }`, so the uploader reads each file's natural `width`/`height` client-side (via `createImageBitmap`) to satisfy the schema.
4. **Notes** — `useFieldArray` of textareas, add/remove.
5. **Links** — `useFieldArray` of `{ label, url }` rows, typed `custom`.
6. **`google_maps_url`** — input whose **placeholder is the live `buildGoogleMapsUrl({ name, city, country })`** (updates as those fields change). On submit, if the field is empty, the derived placeholder value is used; an explicit paste is kept.

## `/moderate` queue page

- **Data:** `listQueue()` → `GET /api/submissions` → `{ submissions: { id, name, architect, city, submitter_name, created_at }[] }`. The worker returns **pending submissions only** (`where status = 'pending'`); there is no `status` or photo-count field in the response, so no status filter is offered in v1.
- **Card:** `name`, `architect`, `city`, `submitter_name`, `created_at`. Click → `/moderate/:id`.
- **Layout:** stacked cards in a scroll area, built on `@nolli/ui` primitives.
- **States:** skeleton while loading; error toast + retry on fetch failure; "Nothing to review" empty state; "not available" if a non-moderator lands here.

## API client additions (`src/lib/api/submissions.ts`)

- `getSubmission(id: number)` → `GET /api/submissions/:id` → `{ submission: SubmissionRow }`, where `SubmissionRow = { id, architecture_id, submitter_id, status, payload: SubmissionPayload, created_at, reviewed_at, submitter_name }`. The form's review-mode initial values are `submission.payload`.
- Type `listQueue()` properly (replace the current `unknown[]`): `{ submissions: { id, name, architect, city, submitter_name, created_at }[] }`.

## Error handling

- **`UnauthorizedError` (401):** caught in the form → `signIn()` (session expired mid-flow). Mirrors the favorites pattern.
- **Validation:** `submissionPayloadSchema` via `zodResolver` → inline per-field errors; Submit/Save disabled until valid.
- **Upload errors:** per-photo — a failed `uploadImage` marks that thumb errored with a retry; doesn't block other photos. Worker 400 (bad content-type / too large) → toast.
- **Decision failures:** Approve/Reject error → toast, stay on the review page (no silent status flip).

## Testing

Add **vitest** to the repo. Cover the one piece of real logic — the pure submit-shaping function (`shape-payload.ts`): form values → `SubmissionPayload`. Assertions:

- Sets `action: "new"` on every photo / note / link.
- Marks the first photo `is_cover: true`, rest `false`.
- Fills `google_maps_url` from `buildGoogleMapsUrl({ name, city, country })` when the field is empty; keeps an explicit value.
- Derives `links[].sort_order` from array index.
- Round-trips through `submissionPayloadSchema.parse(...)` (valid input passes; a missing required field throws).

End-to-end stays manual via the `verify` skill before merge (repo norm).

## Operator prerequisites (flag before E2E, not code)

- Staging R2 bucket public-readable; `VITE_R2_PUBLIC_STAGING_URL` set (so `<PhotoUploader>` / review can render staging images by URL).
- A dev user promoted to `moderator` (so `/moderate` is reachable).

## Dependencies to add

- `react-hook-form`, `@hookform/resolvers` (zod already present via `@nolli/data`).
- `vitest` (dev).

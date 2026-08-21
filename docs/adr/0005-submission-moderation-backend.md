# 5. Submission moderation backend: staging → queue → transactional apply

**Status:** Accepted (decided 2026-07-08 → 2026-07-11, recorded retroactively 2026-08-20)
**Sources:** PR #75 (migration), PR #74 (backend), PR #83 (UI), migration `20260707000001_submissions.sql`, local plan `docs/superpowers/plans/2026-07-07-submission-flow-backend.md` (gitignored — the only surviving spec; the referenced `docs/SUBMISSION-FLOW-DESIGN.md` never landed)

## Context

Community submissions need a path from untrusted input through moderation into
the architecture tables and the map, without unreviewed data ever being public.
The 2026-07-07 plan (quoted in Sources) specified the design; what shipped
diverged in the ways listed at the end.

## Decision

- `public.submissions`: status enum `pending / approved / rejected`, submitter,
  reviewer + note, `architecture_id` once approved. The payload is a
  Zod-validated JSONB change-set (`@nolli/data`) with an action vocabulary
  (`new / updated / deleted / unchanged`); v1 narrows to all-`new`
  (insert-only) while keeping the shape migration-free for future
  edit-existing.
- Images: browser → `POST /api/submissions/uploads` → worker validates
  content-type (jpeg/png/webp) and 10 MB cap → writes to the staging bucket
  under `staging/<submitter_id>/<sha256>.<ext>`. The user-id prefix is a
  lightweight ownership check at create time; the content hash makes keys
  deterministic. Staging is never public.
- Access: any authenticated user creates and edits their own pending
  submission; moderators (role-ranked) see the queue and decide. PATCH is
  locked once a submission leaves `pending`.
- Approve: staging objects copy to prod keys (`architectures/<slug>/<hash>.<ext>`),
  then one Postgres transaction runs `applySubmissionPayload` (resolve country /
  city / architect, allocate a unique slug, insert architecture + photos +
  notes + links) and flips the submission row. On failure, the prod copies are
  deleted and the submission stays pending; on success, staging is cleaned.
- Reject: staging objects are deleted, the row is marked rejected.

Divergences from the 2026-07-07 plan, as shipped: file-router → Hono (#77);
S3-client R2 code → native bindings; `apply-payload.ts` → `apply-submissions.ts`;
`listMine` returns pending only; countries are resolved against the existing
table at apply time (unknown country → 400) rather than auto-created; staging
keys are content-hashed rather than UUIDs.

## Consequences

- Nothing unreviewed is ever publicly reachable; approval is the only path to
  prod storage and the arch tables.
- Approve is not fully atomic across systems — R2 prod copies happen
  pre-commit and are best-effort rolled back on transaction failure. A crash
  between copy and commit can orphan prod objects.
- The map does not show an approved submission until the next bake (ADR 0004).
- Edit-existing remains unbuilt but pre-provisioned by the action vocabulary
  and the `architecture_id` / `base_version_timestamp` columns.

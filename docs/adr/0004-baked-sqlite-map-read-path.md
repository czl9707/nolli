# 4. Map reads from baked SQLite on R2; writes through the worker

**Status:** Accepted (decided 2026-06-01, recorded retroactively 2026-08-20)
**Sources:** PR #17 (bake sqlite), `apps/nolli/scripts/bake-sqlite.ts`, PRs #98–#100 (client data-load fixes), local plan `docs/superpowers/plans/2026-07-07-submission-flow-backend.md` (gitignored)

## Context

The map is read-mostly: hundreds of buildings browsed globally, changed only by
seeding and approved submissions. Serving reads from per-request Postgres
queries would put latency, cost, and load on the database for data that rarely
changes.

## Decision

Two-tier data architecture:

- **Writes** (submissions, favorites) go through the worker API into Supabase
  Postgres (ADR 0005).
- **Reads**: `pnpm --filter nolli bake` (`scripts/bake-sqlite.ts`) reads
  Postgres, writes `nolli-map.db` (SQLite), and uploads it to a dedicated R2
  bucket. Clients download the file, cache it (OPFS), and query it locally.
- Bake was planned as a daily GitHub Action (`.github/workflows/bake.yml`,
  Task 10 of the 2026-07-07 submission plan). **That workflow was never
  created — bake is manual today.**

## Consequences

- The public map is only as fresh as the last manual bake; an approved
  submission does not appear until someone runs bake.
- Client data-loading carries real complexity: OPFS caching + version checks,
  iOS / no-OPFS fallbacks (PRs #98, #100), COEP `crossOrigin` handling (#99).
- In exchange, map browsing puts zero load on Postgres, the dataset is
  CDN-served, and the baked file is cached client-side (OPFS) for repeat loads.
- Automating the bake remains an open, deliberately-unshipped follow-up.

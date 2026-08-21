# 1. pnpm-workspace monorepo layout

**Status:** Accepted (decided 2026-06-29, recorded retroactively 2026-08-20)
**Sources:** PR #54, PR #58, `pnpm-workspace.yaml`, bootstrap commit 0d9c381 (2026-05-15)

## Context

The repo started 2026-05-15 as a single Vite SPA. Within six weeks its code
needed to exist on both sides of the client/worker boundary — chiefly the Zod
payload schemas that the SPA, the worker, and seed/bake scripts must all agree
on. A single-app tree offered either duplication or deep relative imports
across deploy targets.

## Decision

pnpm workspace with two groups, internal deps via `workspace:*`:

- `apps/` — deployables: `nolli` (SPA + Cloudflare Worker), `poster`
  (poster generator, `/overview` & `/spotlight`), `video-gen` (Remotion reels).
- `packages/` — `@nolli/data` (Zod schemas shared by SPA, worker, scripts),
  `@nolli/map` (ArchMap + map textures, consumed by nolli and video-gen),
  `@nolli/ui` (theme + primitives), `@nolli/board` (pin-board UI, nolli only).

Restructure shipped 2026-06-29 (PR #54); npm→pnpm followed 2026-07-01 (PR #58).

## Consequences

- One schema source of truth: client, worker, and scripts validate the same
  payloads through `@nolli/data`.
- `pnpm --filter nolli typecheck` checks nothing — verify with
  `tsc -p tsconfig.worker.json --noEmit` and `tsc -p tsconfig.vite.json --noEmit`
  from `apps/nolli`. Known trap.
- Workspace packages can carry SPA assumptions (theme store reading
  localStorage at module load) into node environments — video-gen/vitest
  imports of `@nolli/map`/`@nolli/ui` need care for that reason.
- The structure was in place just in time: `poster` landed two days later
  (PR #56, 2026-07-01) and `video-gen` a month after that — new deployables
  drop in as new `apps/` entries without restructure.

# AGENTS.md

## Project

Interactive map for viewing architecture. Vite + React 19 + TypeScript SPA with MapLibre GL, deployed to Cloudflare.

## Workspace

pnpm workspace. The app is `apps/nolli/`; shared code is in `packages/{data,ui,map,board}` (package names `@nolli/*`). Packages are source-exported (their `exports` point at `./src/index.ts`, no per-package build). Run commands from the repo root; root scripts delegate to the app via `pnpm --filter nolli` / `pnpm -r`.

## Commands

- `pnpm dev` — Vite dev server (delegates to `apps/nolli`)
- `pnpm build` — generates map patterns, then builds (`generate:patterns` → `vite build`)
- `pnpm --filter nolli generate:patterns` — Sharp SVG→PNG texture generation (script lives in `packages/map/scripts/generate-patterns.ts`; writes to the invoking app's `public/patterns/`, gitignored)
- `pnpm lint` — ESLint (config in `apps/nolli/eslint.config.mjs`)
- `pnpm -r typecheck` — `tsc --noEmit` per package + the app. **See Gotchas: the app's own typecheck script is currently a no-op.**
- `pnpm format` — Prettier
- `pnpm --filter nolli bake` / `bake:dry` — fetch Supabase rows → SQLite DB → upload to R2
- `pnpm --filter nolli seed` / `seed:dry` — upload architecture images to R2 + insert metadata to Supabase
- `pnpm deploy` — build + `wrangler deploy`
- `pnpm preview` — build + `wrangler dev` (local Cloudflare)

No test framework is configured.

## Verification

```
pnpm lint && pnpm -r typecheck && pnpm --filter nolli build
```

`pnpm -r typecheck` runs real typechecks in every `packages/*`; the app's own `typecheck` script is a no-op (see Gotchas), so rely on the package typechecks + the build to catch app errors.

## Architecture

- **Entrypoint**: `apps/nolli/src/main.tsx` → `apps/nolli/src/vite-app.tsx` (BrowserRouter, sync components, layout)
- **Routing**: react-router — `/` (map home), `/arch/:slug` (pin-board detail)
- **Packages**: `@nolli/data` (catalog + SQLite stack, incl. the web worker), `@nolli/ui` (Button/typography/sonner/constants/theme), `@nolli/map` (figure-ground style + MapLibre primitives + pattern generator), `@nolli/board` (pinboard primitives). Dependency graph: `data` and `ui` are leaves; `map` and `board` depend on `ui` + `data`. Packages never import app code (`@/`).
- **Data**: SQLite via Web Worker (`packages/data/src/sqlite-source.ts` → `sqlite-worker.ts`, spawned with `new Worker(new URL(...))` across the package boundary). DB fetched at runtime from R2 (`VITE_R2_PUBLIC_DB_URL`). App-side Zustand `useDbStore` (`apps/nolli/src/stores/db.ts`) initializes the `SqliteDataSource` singleton on import.
- **Auth**: Supabase + Google OAuth. Gated by `VITE_AUTH_ENABLED` env flag — when `false`, sign-in button is disabled, no Supabase calls, user sees "Guest / Coming soon".
- **Map**: MapLibre GL with CARTO vector tiles, custom programmatic style (`packages/map/src/map-style.ts`). App-coupled integration (clusters/markers from app stores) lives in `apps/nolli/src/pages/map/map-core/index.tsx`.
- **Theming**: light/dark via `data-theme` on `<html>`; textures generated per theme. Theme store is `@nolli/ui`'s `useThemeStore`. Ctrl/Cmd+D toggles.
- **State**: Zustand stores in `apps/nolli/src/stores/` — `auth`, `db`, `filter`, `sidebar`, `arch-detail`, `favorites` (plus `theme`, which lives in `@nolli/ui`).

## Layout modes

Two modes via `document.body.dataset.mode` (not React state, so CSS can query it directly):
- **home** — map fills the viewport
- **board** — pin-board detail view; map shrinks into a slot on a fixed canvas

Transition animated with framer-motion variants (`SURFACE_VARIANTS` in `vite-app.tsx`).

## Pin-board system

The reusable primitives live in `@nolli/board` (`packages/board/src/`); the **app-coupled orchestration** stays in the app at `apps/nolli/src/pages/map/pin-board/`:
- **`PinBoardItem`** (app) routes to: `MetadataItem` (app — reads `useArchDetailStore`), and `PhotoItem` / `NoteItem` / `LinkItem` (from `@nolli/board`)
- **`BoardModal`** (`@nolli/board`) — portal overlay for expanding photos/notes
- **Layout** (`@nolli/board` `pin-board-layout`): radial collision-free placement, random rotation via hashId
- **Panning**: `useBoardPan` (`@nolli/board`) — zoom-anchored-to-cursor via framer-motion
- **Paper clipping**: `paperClipPath` (`@nolli/board` `paper-clip`) — procedural irregular edges via hashId + jitter
- **Animation** (`@nolli/ui` `constants`): shared timing (`TRANSITION_SHORT`, `DELAY_START`, `ITEM_STAGGER`). Keep in sync with `--transition-short` in `global.css`.

## Style

- **CSS Modules** (`.module.css`) — NOT Tailwind. prettier-plugin-tailwindcss is installed but unused.
- Path alias: `@/*` → `apps/nolli/src/*` (app code only; packages import each other via `@nolli/*` and never use `@/`)
- Package imports: `@nolli/{data,ui,map,board}` (declared as `workspace:*` deps; bare-name only — packages export only `.`)
- Prettier: no semicolons, double quotes, trailing comma es5
- PostCSS processes `var(--*)` and `@custom-media` at build time (`preserve: false`) — becomes plain CSS in production
- CSS custom properties and breakpoints in `apps/nolli/src/styles/global.css`

## Gotchas

- `apps/nolli/public/patterns/` is gitignored; `pnpm build` regenerates it (the generator lives in `packages/map/scripts/` but writes to the invoking app's `public/`). Dev server may fail without generated patterns.
- **The app's `typecheck` script is a no-op.** `apps/nolli/package.json` runs `tsc --noEmit` against a solution-style `tsconfig.json` (`files: []` + only `references`); plain `tsc` without `-b` doesn't compile referenced projects, so it catches nothing. The `packages/*` typechecks (`tsc -p tsconfig.json --noEmit`) are real — rely on `pnpm -r typecheck` + `pnpm build`. (Pre-existing; fixing it may surface pre-existing type errors.)
- **pnpm ignores native build scripts** (`better-sqlite3`, `sharp`, `esbuild`, …) by default. The running app is unaffected (it uses sqlite-wasm), but the `bake`/`seed` dev scripts need them — run `pnpm approve-builds` before using those.
- `bake` and `seed` scripts require `.env.local` with Supabase + R2 credentials (non-VITE env vars).
- Vite only exposes `VITE_*` env vars to client code. Other vars (secret keys) are server-scripts only. (`@nolli/data` reads `VITE_R2_PUBLIC_DB_URL` via `import.meta.env`, so it assumes a Vite build host.)
- Non-leaf packages (`@nolli/map`, `@nolli/board`) deliberately omit `composite`/project-references (can't cleanly consume sibling packages as source under `--noEmit`); leaf packages (`@nolli/data`, `@nolli/ui`) do use `composite`. Typecheck truth is per-package `tsc --noEmit`, not a root `tsc -b` graph.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`czl9707/nolli`). Uses the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at repo root. See `docs/agents/domain.md`.

## apps/poster

A standalone static site for composing "map posters": Nolli's figure-ground map
with curated building photos dropped at their real locations. Hand-pick buildings
from the left sidebar; selected buildings' cover photos appear on the map.
Capture mode hides all scaffolding for a clean screenshot.

- Dev: `pnpm dev:poster`
- Build: `pnpm build:poster` (fetches snapshot from R2, generates patterns, bundles)
- Data: build-time snapshot fetched from the public R2 db
  (`https://db.nolli-map.com/latest.db`) → `public/snapshot.json`. No credentials.
- No worker, no auth, no backend.

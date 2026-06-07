# AGENTS.md

## Project

Interactive map for viewing architecture. Vite + React 19 + TypeScript SPA with MapLibre GL, deployed to Cloudflare Pages.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — generates map patterns, then builds (`generate:patterns` → `vite build`)
- `npm run generate:patterns` — Sharp SVG→PNG texture generation into `public/patterns/` (gitignored)
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Prettier
- `npm run bake` / `npm run bake:dry` — fetch Supabase rows → SQLite DB → upload to R2
- `npm run seed` / `npm run seed:dry` — upload architecture images to R2 + insert metadata to Supabase
- `npm run deploy` — build + `wrangler deploy`
- `npm run preview` — build + `wrangler dev` (local Cloudflare)

No test framework is configured.

## Verification

```
npm run lint && npm run typecheck
```

## Architecture

- **Entrypoint**: `src/main.tsx` → `src/vite-app.tsx` (BrowserRouter, sync components, layout)
- **Routing**: react-router — `/` (map home), `/arch/:slug` (pin-board detail)
- **Data**: SQLite via Web Worker (`src/lib/data/sqlite-source.ts` → `sqlite-worker.ts`). DB fetched at runtime from R2 (`VITE_R2_PUBLIC_DB_URL`). Zustand `useDbStore` initializes the `SqliteDataSource` singleton on import.
- **Auth**: Supabase + Google OAuth. Gated by `VITE_AUTH_ENABLED` env flag — when `false`, sign-in button is disabled, no Supabase calls, user sees "Guest / Coming soon".
- **Map**: MapLibre GL with CARTO vector tiles, custom programmatic style (`src/lib/map-style.ts`)
- **Theming**: light/dark via `data-theme` on `<html>`; textures generated per theme. Ctrl/Cmd+D toggles.
- **State**: Zustand stores in `src/stores/` — `auth`, `db`, `layout`, `sidebar`, `filter`, `arch-detail`, `theme`

## Layout modes

Two modes via `document.body.dataset.mode` (not React state, so CSS can query it directly):
- **home** — map fills the viewport
- **board** — pin-board detail view; map shrinks into a slot on a fixed canvas

Transition animated with framer-motion variants (`SURFACE_VARIANTS` in `vite-app.tsx`).

## Pin-board system

`src/components/pin-board/` — scattered items on a pannable canvas:
- **PinBoardItem** routes to: MetadataItem, LinkItem, NoteItem, PhotoItem
- **BoardModal** — portal overlay for expanding photos/notes
- **Layout** (`src/lib/pin-board-layout.ts`): radial collision-free placement, random rotation via hashId
- **Panning**: `useBoardPan` — zoom-anchored-to-cursor via framer-motion
- **Paper clipping**: `paperClipPath` — procedural irregular edges via hashId + jitter
- **Animation** (`src/lib/constants.ts`): shared timing (`TRANSITION_SHORT`, `DELAY_START`, `ITEM_STAGGER`). Keep in sync with `--transition-short` in `global.css`.

## Style

- **CSS Modules** (`.module.css`) — NOT Tailwind. prettier-plugin-tailwindcss is installed but unused.
- Path alias: `@/*` → `src/*`
- Prettier: no semicolons, double quotes, trailing comma es5
- PostCSS processes `var(--*)` and `@custom-media` at build time (`preserve: false`) — becomes plain CSS in production
- CSS custom properties and breakpoints in `src/styles/global.css`

## Gotchas

- `public/patterns/` is gitignored; `npm run build` regenerates it. Dev server may fail without generated patterns.
- `bake` and `seed` scripts require `.env.local` with Supabase + R2 credentials (non-VITE env vars).
- Vite only exposes `VITE_*` env vars to client code. Other vars (secret keys) are server-scripts only.
- The README may reference Next.js/shadcn from an earlier version — this is a Vite + React project.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`czl9707/nolli`). Uses the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at repo root. See `docs/agents/domain.md`.

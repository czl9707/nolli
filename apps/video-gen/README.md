# video-gen

Remotion v4 app that generates Nolli's marketing videos. The home for **all**
video output — current and future. The first (and currently only) product is the
**Architect Spotlight reel**: a ~30 s per-architect social reel that reveals a
body of work through geography and chronology, with the architect's name as the
payoff.

Rendered live inside Remotion — the real Nolli `ArchMap` is mounted in the
composition and driven per-frame (no Playwright capture). Swapping the architect
slug produces a new video from the same template.

## Prerequisites

- **System Chrome/Chromium** installed (e.g. `/usr/bin/google-chrome`). Remotion's
  bundled Headless Shell download is SSL-blocked in this environment; the render
  scripts fall back to a system browser via `REMOTION_BROWSER_EXECUTABLE` (or
  auto-detect it).
- **Vector pattern PNGs generated** once: `pnpm generate:patterns` (writes
  `public/patterns/`, gitignored). Without these, every map `fill-pattern` layer
  404s and the map renders blank.
- A populated sqlite snapshot of the Nolli DB at `~/.nolli/latest.db` (the seed
  step fetches it from `https://db.nolli-map.com/latest.db` if missing). If the
  native `better-sqlite3` build was skipped on install, rebuild it in its package
  dir before seeding.

## Pipeline

Three CLIs, always run in this order, each taking the architect **slug**
(`-`→space to match the architect name, e.g. `sanaa`, `ban-shigeru`):

```sh
pnpm --filter video-gen seed <slug>     # 1. build reel.json from the DB
pnpm --filter video-gen assets <slug>    # 2. download + resize cover images
pnpm --filter video-gen render <slug>    # 3. bundle + render to mp4
```

(Or `cd apps/video-gen` and run `pnpm seed <slug>`, etc.)

### `seed <slug>`

Resolves the architect + their buildings (joining `architecture_photos` for the
cover image) from the cached sqlite snapshot, computes stats, and writes
`out/<slug>/reel.json`. **Non-destructive** — an existing `reel.json` is never
overwritten; delete it to re-seed. Also writes `out/all-arch.json` (the
background markers for the world map).

### `assets <slug>`

HTTP-fetches each building's cover image and writes two derivatives per building
via sharp into `public/data/<slug>/images/`:
`<slug>-hero.jpg` (1600×1000) and `<slug>-thumb.jpg` (240×240). Pure download —
no browser. Skips buildings with no cover image; warns on download failure.

### `render <slug>`

Stages `reel.json` into `public/data/<slug>/`, bundles the Remotion entry,
and renders the `reel` composition (1920×1080, h264) to `out/<slug>/<slug>.mp4`.

The composition reads its config **browser-side** via `staticFile` + `fetch`
(gated on `delayRender`), not `readFileSync` — Remotion runs in a browser, where
`node:fs` doesn't exist. This is also why there are two output dirs: `out/` is
the node-side build dir (seed output + final mp4), while `public/data/` is the
staged runtime copy Remotion *serves* to the browser — `render` copies the
config from `out/` into `public/data/` so the composition can fetch it.

#### Render env vars

| Var | Purpose |
| --- | --- |
| `REMOTION_BROWSER_EXECUTABLE` | Path to system Chrome/Chromium (required if not auto-detected). |
| `REEL_MAX_FRAMES` | Cap the duration for fast test renders (suffixes the output, e.g. `<slug>-120f.mp4`). |
| `REEL_CONCURRENCY` | Override Remotion's render concurrency (lower eases vector-tile pressure). |

`--gl=angle` is **required** for maplibre under headless render — without it,
`new MapLibreGL.Map()` throws `Failed to initialize WebGL`. The render script
sets this via `chromiumOptions: { gl: "angle" }`.

> Full renders are slow (~15–30 min for 900 frames) because each frame waits for
> a tile repaint. That's expected.

## Output

| File | Description |
| --- | --- |
| `out/<slug>/reel.json` | Seed-generated config (the render's source of truth). |
| `out/all-arch.json` | Background world-map markers. |
| `public/data/<slug>/images/` | Hero + thumb cover derivatives. |
| `out/<slug>/<slug>.mp4` | The rendered 16:9 master. |

`out/`, `public/data/`, and `public/patterns/` are all gitignored — nothing
generated is committed.

## Dev

- **Studio** (live preview while editing the composition):
  `pnpm --filter video-gen studio`
- **Typecheck** (this one works; the repo-wide `pnpm typecheck` is a no-op
  elsewhere): `pnpm --filter video-gen typecheck` → `tsc -p tsconfig.json --noEmit`.
  This app pins TS 5.9.3 — Remotion's bundler crashes on TS 7's removed `ts.sys`.
- **Tests**: `pnpm --filter video-gen test` (vitest, node environment).

## How to add a new video feature

This is the single app for all video output. New reels/formats (vertical 9:16,
per-architect copy, a different story template) belong here, not in a new app.

1. **Config** — extend `src/lib/config.ts` (`ReelConfig`) and the
   `scripts/config-builder.ts` if the new shape needs DB-derived data.
2. **Composition** — add a new `<Composition>` in `src/Root.tsx` (the existing
   `reel` composition is the reference), or a new beat within `ReelComposition`.
   Beat timing lives in `src/lib/timeline.ts`; frame math uses Remotion's
   `interpolate`/`Easing` built-ins (see `src/lib/viewport.ts` for the easing
   convention — `Easing.bezier` matches CSS `ease`; `Easing.ease` does **not**).
3. **A fold rule for `lib/` → component**: it's fine to fold a single-consumer
   pure lib module into its `.tsx` consumer **unless** that component transitively
   imports `MapProvider` (it pulls `@nolli/ui`'s `useThemeStore`, which reads
   `localStorage` at module-load and breaks node-environment vitest). When in
   doubt, keep pure + tested logic in `lib/`.

## History

The original Playwright live-capture pipeline (CDP screencast + slow-mo clock) is
archived on `origin/archive/motion-live-capture`. This app was renamed from
`motion` to `video-gen` to reflect that it is the home for all video output, not
only motion-captured content.

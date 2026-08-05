# apps/motion — Architect Spotlight video

Generates a per-architect marketing video ("Architect Spotlight") from the live
Nolli app. Templated: one manifest per architect drives the whole thing.

**Output:** 16:9 1920×1080 h264 mp4 at 30 fps. Final video at
`apps/motion/out/<slug>/<slug>.mp4`.

## Timeline

`name → first-half stills → count → second-half stills → now → Scene 2 (map journey) → logo`

- **Stills** — Ken-Burns-free hard cuts (detail photo + board lightbox per building).
- **Scene 2** — a captured "Body of Work" user journey through the real app:
  open mid-zoom on the hero → ease in → flyTo the farthest building → "Go to Pin
  Board" morph → open a photo lightbox → close it → drag-pan the board.
- **Outro** — name / count / "Now available in" / logo segments.

## Prerequisites

1. **Nolli dev server running on :5173** (the capture scripts drive the live app):
   ```sh
   pnpm --filter nolli dev
   ```
2. **ffmpeg + ffprobe** on PATH (`assemble` ffprobes the captured clip to size Scene 2).
3. **App DB** — downloaded automatically to `~/.nolli/latest.db` on the first
   `manifest` run (no manual step).

## Pipeline

Run each step from `apps/motion/` (or prefix with `pnpm --filter motion`).
`<slug>` is the architect slug — the architect's name, lowercased, spaces → `-`
(e.g. `sanaa`, `tadao-ando`, `ludwig-mies-van-der-rohe`).

### 1. Manifest — resolve the architect + buildings from the DB

```sh
pnpm manifest <slug> [hero-building-slug]
```

- Resolves the architect's display name and buildings from sqlite.
- `hero-building-slug` is optional; it defaults to the architect's earliest
  building (year-ascending). The hero is the one Scene 2 opens on.
- Writes `out/<slug>/manifest.json`.

### 2. Images — capture the still photos

```sh
pnpm assets:images <slug>
```

- For every building: screenshots the detail view (`<slug>-detail.png`) and the
  board view with its cover photo opened in the lightbox (`<slug>-board.png`).
- Writes `out/<slug>/images/` and seeds `out/<slug>/video.json` (the playlist).

### 3. Morph — capture Scene 2 (the map journey)

```sh
pnpm assets:morph <slug>
```

- Drives the real app through the journey via the `?capture=1` map handle
  (`window.__nolliMap`), captured with a slow-mo CDP screencast and resampled to
  real-time 30 fps.
- Picks the farthest building from the hero (great-circle) as the flyTo target.
- Writes `out/<slug>/morph.mp4` + `morph-end.png`, and sets `morph` in
  `video.json`. **Needs the dev server.**

### 4. Assemble — stage assets + render the final video

```sh
pnpm assemble <slug>
```

- Stages the playlist into `public/capture/<slug>/` (what Remotion serves via
  `staticFile`), ffprobes `morph.mp4` to set the Scene 2 frame count, bundles,
  and renders.
- Writes `out/<slug>/<slug>.mp4`.

### Full run, one architect

```sh
pnpm manifest ludwig-mies-van-der-rohe
pnpm assets:images ludwig-mies-van-der-rohe
pnpm assets:morph ludwig-mies-van-der-rohe
pnpm assemble ludwig-mies-van-der-rohe
```

## Optional / partial

- **Outro segments only** — `pnpm assets:outro <slug>` renders the four outro
  clips standalone (`out/<slug>/outro-*.mp4`) for interleaving with other material.
- **Skip Scene 2** — omit the `assets:morph` step. `assemble` renders a
  stills-only video (no morph → `mapClipFrames` cleared, Scene 2 dropped).
- **Re-tune the journey** — all Scene 2 timing (zooms, holds, pan count/distance,
  slow-mo factor) lives in the `JOURNEY` const at the top of
  `scripts/assets-morph.ts`. Re-run `assets:morph` then `assemble` after editing.
- **Re-render only** — after editing Remotion source, just re-run `assemble`
  (reuses the existing captured assets).

## Other

- **Studio** — `pnpm studio` opens Remotion Studio for live preview.
- **Tests** — `pnpm test` (vitest). **Typecheck** — `pnpm exec tsc -p
  tsconfig.json --noEmit` (the `pnpm typecheck` script is a no-op).

## Notes & gotchas

- All generated artifacts (`out/`, `public/capture/`) are **gitignored** — nothing
  produced here is committed.
- The slow-mo screencast keeps capture wall-time bounded to avoid Chrome
  compositor throttling; if a capture comes back with too few frames, raise
  `JOURNEY.slowmo` toward `0.5` (do not lower it).
- The journey needs **≥2 buildings** for an architect (it flies between two);
  fewer throws a clear error.
- `assets:morph` asserts the board drag-pan actually moved (catches a silent
  capture failure loudly).

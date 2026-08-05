# apps/motion — Architect Spotlight video

Generates a per-architect marketing video ("Architect Spotlight") from the live
Nolli app. Templated: one manifest per architect drives the whole thing.

**Output:** 16:9 1920×1080 h264 mp4 at 30 fps. Final video at
`apps/motion/out/<slug>/<slug>.mp4`.

## Timeline

Driven by an ordered `scenes[]` list in `video.json` (written by `seed`,
editable freely): `image* (board) → text (name) → image* (detail) → text (count)
→ video (morph-1) → text (now) → video (morph-2) → logo`. The list leads with a
board photo so the social-media preview thumbnail is a real image, not the dark
text card; the "Now available in" card splits the two morph chunks so the demo
doesn't play as one long video. Each image entry is one photo; reordering or
cutting the video is a `video.json` edit, not code.

- **`text`** — typed outro-style segment (name / count / "Now available in").
- **`image`** — a hard-cut still, one entry per photo.
- **`video`** — a captured morph chunk. Each entry has its own `playbackRate`
  (morph chunks run at 2×) and an optional `endStill` (frozen on the chunk's
  last frame after it ends).
- **`logo`** — the Nolli logo card.

## Config files

Both written by `seed` into `out/<slug>/`. Edit them; rerun the affected step.

- **`video.json`** — the generation config: an ordered `scenes[]` list. Edit to
  reorder, drop, or swap scenes. Each `video` entry carries `playbackRate` and
  optional `endStill`. Example:

  ```jsonc
  {
    "slug": "mies",
    "fontVariant": "playful",
    "scenes": [
      { "type": "image", "src": "images/a-board.png" },
      { "type": "image", "src": "images/b-board.png" },
      { "type": "text", "text": "Ludwig Mies van der Rohe", "size": 132, "color": "fg" },
      { "type": "image", "src": "images/a-detail.png" },
      { "type": "image", "src": "images/b-detail.png" },
      { "type": "text", "text": "2 architectures", "size": 104, "color": "fg" },
      { "type": "video", "src": "morph-1.mp4", "playbackRate": 2 },
      { "type": "text", "text": "Now available in", "size": 104, "color": "fgSecondary" },
      { "type": "video", "src": "morph-2.mp4", "playbackRate": 2, "endStill": "morph-end.png" },
      { "type": "logo" }
    ]
  }
  ```

- **`morph.json`** — the recording config for `assets:morph`:

  ```jsonc
  {
    "journey": { "hero": "<building-slug>", "far": "<building-slug>" },
    "seamAfterBeat": 4,
    "tuning": { "slowmo": 0.4, "establishZoom": 10 /* …all capture knobs… */ }
  }
  ```

## Prerequisites

1. **Nolli dev server running on :5173** (the capture scripts drive the live app):
   ```sh
   pnpm --filter nolli dev
   ```
2. **ffmpeg + ffprobe** on PATH (`assemble` ffprobes each video scene to size it).
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

### 2. Seed — write the config files

```sh
pnpm seed <slug>
```

- Reads `manifest.json`, writes **`morph.json`** (recording config: `journey`
  hero/far, `seamAfterBeat`, all capture tuning) and **`video.json`** (the
  ordered `scenes[]` generation config).
- Non-destructive on rerun: preserves a hand-edited `journey` /
  `seamAfterBeat` / `tuning` in `morph.json`, and preserves `video.json` for
  the same slug. Delete `video.json` to re-seed it fresh (it is overwritten only
  when the slug differs).

### 3. Images — capture the still photos

```sh
pnpm assets:images <slug>
```

- For every building: screenshots the detail view (`<slug>-detail.png`) and the
  board view with its cover photo opened in the lightbox (`<slug>-board.png`).
- Writes `out/<slug>/images/*` (no JSON — `video.json` already lists each image
  as its own scene entry).

### 4. Morph — capture Scene 2 (the map journey)

```sh
pnpm assets:morph <slug>
```

- Reads `morph.json`. Drives the real app through the journey via the
  `?capture=1` handles (`window.__nolliMap` for the camera,
  `window.__nolliNavigateArch` for the real arch→arch navigation), captured with
  a slow-mo CDP screencast and resampled to real-time 30 fps.
- The two buildings the journey flies between come from `morph.json`'s
  `journey.hero` / `journey.far` (seeded to the hero + its farthest building;
  edit `morph.json` to pin them).
- The recording is split into two chunks at beat `seamAfterBeat` (1-indexed;
  default `4` = before entering the board). The seam is a **hard cut** — move it
  by editing `seamAfterBeat`. Writes `out/<slug>/morph-1.mp4`, `morph-2.mp4`,
  and `morph-end.png`. **Needs the dev server.**

### 5. Assemble — stage assets + render the final video

```sh
pnpm assemble <slug>
```

- Reads `video.json`, stages every referenced file into `public/capture/<slug>/`
  (what Remotion serves via `staticFile`), ffprobes each `video` scene to size
  it, bundles, and renders.
- Writes `out/<slug>/<slug>.mp4`.

### Full run, one architect

```sh
pnpm manifest ludwig-mies-van-der-rohe
pnpm seed ludwig-mies-van-der-rohe
pnpm assets:images ludwig-mies-van-der-rohe
pnpm assets:morph ludwig-mies-van-der-rohe
pnpm assemble ludwig-mies-van-der-rohe
```

## Optional / partial

- **Outro segments only** — `pnpm assets:outro <slug>` renders the four outro
  clips standalone (`out/<slug>/outro-*.mp4`) for interleaving with other material.
- **Skip Scene 2** — drop the two `video` entries (and `morph-end.png`) from
  `video.json`. `assemble` then renders a stills-only cut.
- **Re-tune the journey** — all capture tuning (zooms, holds, pan counts /
  distance / speed, slow-mo) lives in `morph.json`'s `tuning` block. Write it
  via `pnpm seed <slug>` (preserves your hand-edits on rerun), or edit
  `morph.json` directly, then re-run `assets:morph` and `assemble`. The final-cut
  playback speed of each morph chunk is the `playbackRate` on its `video` entry
  in `video.json` (default `2`).
- **Move the cut** — edit `morph.json`'s `seamAfterBeat` (1-indexed beat; default
  `4`), then re-run `assets:morph` + `assemble`.
- **Outro typing speed** — every `text` segment reveals its text over one fixed
  window, `OUTRO.typeFrames` in `src/lib/outro.ts` (≈0.75s @30fps), followed by
  `OUTRO.hold`. Independent of text length.
- **Re-render only** — after editing Remotion source or `video.json`, just
  re-run `assemble` (reuses the existing captured assets).

## Other

- **Studio** — `pnpm studio` opens Remotion Studio for live preview.
- **Tests** — `pnpm test` (vitest). **Typecheck** — `pnpm exec tsc -p
  tsconfig.json --noEmit` (the `pnpm typecheck` script is a no-op).

## Notes & gotchas

- All generated artifacts (`out/`, `public/capture/`) are **gitignored** — nothing
  produced here is committed.
- The slow-mo screencast keeps capture wall-time bounded to avoid Chrome
  compositor throttling; if a capture comes back with too few frames, raise
  `tuning.slowmo` in `morph.json` toward `0.5` (do not lower it).
- The journey needs **≥2 buildings** for an architect (it flies between two);
  fewer throws a clear error.
- `assets:morph` asserts the board drag-pan actually moved (catches a silent
  capture failure loudly).

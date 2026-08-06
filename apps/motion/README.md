# apps/motion — Architect Spotlight video

Generates a per-architect marketing video ("Architect Spotlight") from the live
Nolli app. Templated: one manifest per architect drives the whole thing.

**Output:** 16:9 1920×1080 h264 mp4 at 30 fps. Final video at
`apps/motion/out/<slug>/<slug>.mp4`.

## Timeline

Driven by an ordered `scenes[]` list in `video.json` (written by `seed`,
editable freely): `image* (board) → text (name) → image* (detail) → text (count)
→ video (demo-1) → text (now) → logo`. The list leads with a board photo so the
social-media preview thumbnail is a real image, not the dark text card. The
default cut uses **one** demo chunk — the journey → board reveal (ending on a
visible hold). Each image entry is one photo; reordering or cutting the video is
a `video.json` edit, not code.

- **`text`** — typed outro-style segment (name / count / "Now available in").
- **`image`** — a hard-cut still, one entry per photo.
- **`video`** — a captured demo chunk. Each entry has its own `playbackRate`
  (demo runs at 2×) and an optional `endStill` (frozen on the chunk's last
  frame after it ends — used by the optional second chunk).
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
      { "type": "text", "text": "2 Architectures", "size": 104, "color": "fg" },
      { "type": "video", "src": "demo-1.mp4", "playbackRate": 2 },
      { "type": "text", "text": "Now available in", "size": 104, "color": "fg" },
      { "type": "logo" }
    ]
  }
  ```

  The default cut is one demo chunk. `assets:demo` still captures the full
  journey as two chunks (`demo-1.mp4`, `demo-2.mp4`); add a second `video`
  entry (with `endStill: "demo-end.png"`) to use the long-form demo.

- **`demo.json`** — the recording config for `assets:demo`, kept minimal:

  ```jsonc
  {
    "journey": { "hero": "<building-slug>", "far": "<building-slug>" },
    "seamAfterBeat": 5
  }
  ```

  `seamAfterBeat` (1-indexed beat, default 5 = after the board open + hold) is
  where the captured journey is split into two chunks; chunk 1 is the default
  cut.

## Prerequisites

1. **Nolli dev server running on :5173** (the capture scripts drive the live app):
   ```sh
   pnpm --filter nolli dev
   ```
2. **ffmpeg + ffprobe** on PATH (`assemble` ffprobes each video scene to size it).
3. **App DB** — downloaded automatically to `~/.nolli/latest.db` on the first
   `seed` run (no manual step).

## Pipeline

Run each step from `apps/motion/` (or prefix with `pnpm --filter motion`).
`<slug>` is the architect slug — the architect's name, lowercased, spaces → `-`
(e.g. `sanaa`, `tadao-ando`, `ludwig-mies-van-der-rohe`).

### 1. Seed — resolve from the DB + write the config files

```sh
pnpm seed <slug>
```

- Resolves the architect's display name + buildings from sqlite and writes
  `out/<slug>/manifest.json`, then derives **`demo.json`** (recording config:
  `journey` hero/far, `seamAfterBeat`) and **`video.json`** (the ordered
  `scenes[]` generation config) from it.
- The hero always defaults to the architect's earliest building (year-ascending);
  to open on a different building, edit `journey.hero` in `demo.json`.
- Non-destructive on rerun: preserves a hand-edited `journey` / `seamAfterBeat`
  in `demo.json`, and preserves `video.json` for the same slug. Delete
  `video.json` to re-seed it fresh (it is overwritten only when the slug differs).

### 2. Assets — capture stills + the map-journey demo

```sh
pnpm assets <slug>      # images, then demo (umbrella)
pnpm assets:images <slug>   # just the still photos
pnpm assets:demo <slug>     # just the map journey
```

- **images** — for every building: screenshots the detail view
  (`<slug>-detail.png`) and the board view with its cover photo opened in the
  lightbox (`<slug>-board.png`). Writes `out/<slug>/images/*`.
- **demo** — reads `demo.json`. Drives the real app through the journey via the
  `?capture=1` handles (`window.__nolliMap` for the camera,
  `window.__nolliNavigateArch` for the real arch→arch navigation), captured with
  a slow-mo CDP screencast and resampled to real-time 30 fps. The two buildings
  the journey flies between come from `demo.json`'s `journey.hero` /
  `journey.far` (seeded to the hero + its farthest building; edit `demo.json`
  to pin them). The recording is split into two chunks at beat `seamAfterBeat`
  (1-indexed; default `5` = after the board open + hold); the seam is a **hard
  cut**. Writes `out/<slug>/demo-1.mp4`, `demo-2.mp4`, and `demo-end.png`.
  **Needs the dev server.**

### 3. Assemble — stage assets + render the final video

```sh
pnpm assemble <slug>
```

- Reads `video.json`, stages every referenced file into `public/capture/<slug>/`
  (what Remotion serves via `staticFile`), ffprobes each `video` scene to size
  it, bundles, and renders.
- Writes `out/<slug>/<slug>.mp4`.

### Full run, one architect

```sh
pnpm seed ludwig-mies-van-der-rohe
pnpm assets ludwig-mies-van-der-rohe
pnpm assemble ludwig-mies-van-der-rohe
```

## Optional / partial

- **Skip Scene 2** — drop the `video` entry from `video.json`. `assemble` then
  renders a stills-only cut.
- **Long-form demo** — `assets:demo` captures two chunks; the default
  `video.json` uses only `demo-1.mp4`. Add a second `video` entry (with
  `endStill: "demo-end.png"`) to use `demo-2.mp4`.
- **Re-tune the journey** — all capture tuning (zooms, holds, pan counts /
  distance / speed, slow-mo) lives in `DEFAULT_TUNING` in
  `scripts/demo-config.ts` (code, not config). Edit it, then re-run
  `assets:demo` and `assemble`. The final-cut playback speed of each demo
  chunk is the `playbackRate` on its `video` entry in `video.json` (default `2`).
- **Move the cut** — edit `demo.json`'s `seamAfterBeat` (1-indexed beat; default
  `5` = after the board open + hold), then re-run `assets:demo` + `assemble`.
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
  `slowmo` in `DEFAULT_TUNING` (`scripts/demo-config.ts`) toward `0.5` (do not
  lower it).
- The journey needs **≥2 buildings** for an architect (it flies between two);
  fewer throws a clear error.
- `assets:demo` asserts the board drag-pan actually moved (catches a silent
  capture failure loudly).

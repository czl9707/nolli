# apps/demo-gen — spotlight videos

Generates marketing videos from the live Nolli app. Templated: one config
directory per slug drives the whole thing. Two seed modes:

- `seed:architect <architect-slug>` — the per-architect "Architect Spotlight".
- `seed:architecture <building-slug>` — a single-architecture video: one
  building, all of its board photos.

**Output:** 16:9 1920×1080 h264 mp4 at 30 fps. Final video at
`apps/demo-gen/out/<slug>/<slug>.mp4`.

## Timeline

Driven by an ordered `scenes[]` list in `video.json` (written by the seed
step, editable freely). Architect-mode cut: `video (demo-1) → text (name) →
image* (board) → text (count) → image* (detail) → text (now) → logo`. The
list leads with the demo (the journey → board reveal → photo open), then
alternates text → image sets. Each image entry is one photo; reordering or
cutting the video is a `video.json` edit, not code.

Architecture-mode cut: `video (demo-1, 1.5×) → text (building name) → text
(architect) → text ("City, CC") → image* (board photos, shot-list order) →
text (now) → logo`. The place card drops the city when null and disappears
entirely when both are null.

Note: leading with the demo means the social-media preview thumbnail is the
demo's first frame, not a still photo.

- **`text`** — typed outro-style segment (name / count / place / "Now available in").
- **`image`** — a hard-cut still, one entry per photo.
- **`video`** — a captured demo clip. Each entry has its own `playbackRate`
  (architect demo runs at 2×, architecture demo at 1.5×).
- **`logo`** — the Nolli logo card.

## Config files

All written by the seed step into `out/<slug>/`. Edit them; rerun the affected
step.

- **`video.json`** — the generation config: an ordered `scenes[]` list. Edit to
  reorder, drop, or swap scenes. Each `video` entry carries `playbackRate`.
  Example:

  ```jsonc
  {
    "slug": "mies",
    "scenes": [
      { "type": "video", "src": "demo-1.mp4", "playbackRate": 2 },
      { "type": "text", "text": "Ludwig Mies van der Rohe", "size": 132, "color": "fg" },
      { "type": "image", "src": "images/a-board-0.png" },
      { "type": "image", "src": "images/b-board-0.png" },
      { "type": "text", "text": "2 Architectures", "size": 104, "color": "fg" },
      { "type": "image", "src": "images/a-detail.png" },
      { "type": "image", "src": "images/b-detail.png" },
      { "type": "text", "text": "Now available in", "size": 104, "color": "fg" },
      { "type": "logo" }
    ]
  }
  ```

  The default cut uses the single captured demo clip (`demo-1.mp4`).

- **`images.json`** — the shot list for `assets:images`:

  ```jsonc
  {
    "shots": [
      { "building": "<building-slug>", "type": "board", "photo": 0 },
      { "building": "<building-slug>", "type": "board", "photo": 1 },
      { "building": "<building-slug>", "type": "detail" }
    ]
  }
  ```

  `board` opens the n-th photo (0-based, board strip order) in the lightbox →
  `images/<building>-board-<n>.png`; `detail` screenshots the architecture
  page → `images/<building>-detail.png`. `video.json`'s image scenes are
  derived from this list at seed time, so the two cannot drift. Hand-editing
  the list and re-running `assets:images` is a supported workflow.

- **`demo.json`** — the recording config for `assets:demo`, kept minimal:

  ```jsonc
  {
    "journey": ["<building-slug>", "<building-slug>"]
  }
  ```

  The journey is the list of buildings the demo visits, in order: it opens on
  the first, real-navigates to each subsequent one, and runs the board + photo
  section on the last. Needs ≥1 slug.

## Prerequisites

1. **Nolli dev server running on :5173** (the capture scripts drive the live app):
   ```sh
   pnpm --filter nolli dev
   ```
2. **ffmpeg + ffprobe** on PATH (`assemble` ffprobes each video scene to size it).
3. **App DB** — downloaded automatically to `~/.nolli/latest.db` on the first
   seed run (no manual step).

## Pipeline

Run each step from `apps/demo-gen/` (or prefix with `pnpm --filter demo-gen`).
`<slug>` is the architect slug for `seed:architect` (the architect's name,
lowercased, spaces → `-`, e.g. `sanaa`, `tadao-ando`,
`ludwig-mies-van-der-rohe`) and the building slug for `seed:architecture`.

### 1. Seed — resolve from the DB + write the config files

```sh
pnpm seed:architect <architect-slug>
pnpm seed:architecture <building-slug>
```

Both re-download the DB when passed `--fresh` (e.g.
`pnpm seed:architect <slug> --fresh`).

- **architect** — resolves the architect's display name + buildings from
  sqlite and writes `out/<slug>/manifest.json`, then derives **`demo.json`**
  (the journey — defaults to the architect's earliest building, year-ascending,
  plus one random other), **`images.json`** (per building: one detail shot +
  one board photo:0 shot), and **`video.json`** from it.
- **architecture** — resolves the building (keeping its architect, for the
  text cards) and its photo count from sqlite. The manifest holds exactly
  that building, the journey is `[slug]`, the shot list is board 0..N-1 (no
  detail shot), and the scene template runs the demo at 1.5× with name /
  architect / place cards.
- Non-destructive on rerun: preserves a hand-edited `journey` in `demo.json`,
  the `shots` in `images.json`, and `video.json` for the same slug. Delete a
  file to re-seed it fresh.

### 2. Assets — capture stills + the map-journey demo

```sh
pnpm assets <slug>          # images, then demo (umbrella)
pnpm assets:images <slug>   # just the still photos
pnpm assets:demo <slug>     # just the map journey
```

- **images** — reads `images.json`. Per shot: `board` screenshots the board
  view with the n-th photo opened in the lightbox
  (`images/<building>-board-<n>.png`); `detail` screenshots the architecture
  page (`images/<building>-detail.png`). Writes `out/<slug>/images/*`.
- **demo** — reads `demo.json`. Drives the real app through the journey (the
  slug list, in order) via the `?capture=1` handles (`window.__nolliMap` for the
  camera, `window.__nolliNavigateArch` for the real arch→arch navigation),
  captured with a slow-mo CDP screencast and resampled to real-time 30 fps.
  Writes `out/<slug>/demo-1.mp4`.
  **Needs the dev server.**

### 3. Assemble — render the final video

```sh
pnpm assemble <slug>
```

- Reads `video.json`, ffprobes each `video` scene to size it, bundles (serving
  `out/<slug>` directly as the Remotion public dir — no staging copy), and
  renders.
- Writes `out/<slug>/<slug>.mp4`.

### Full run, one architect

```sh
pnpm seed:architect ludwig-mies-van-der-rohe
pnpm assets ludwig-mies-van-der-rohe
pnpm assemble ludwig-mies-van-der-rohe
```

Single architecture: same three steps with `seed:architecture <building-slug>`.

## Optional / partial

- **Skip the demo** — drop the `video` entry from `video.json`. `assemble` then
  renders a stills-only cut.
- **Re-tune the journey** — all capture tuning (zooms, holds, pan counts /
  distance / speed, slow-mo) lives in `DEFAULT_TUNING` in
  `scripts/seed/demo-config.ts` (code, not config). Edit it, then re-run
  `assets:demo` and `assemble`. The final-cut playback speed of the demo
  clip is the `playbackRate` on its `video` entry in `video.json` (default `2`).
- **Re-shoot the stills** — edit `shots` in `images.json` (drop shots, add
  more `board` photos), then re-run `assets:images` and `assemble`. New shots
  also need matching `image` scenes in `video.json` — edit it, or delete it and
  re-run the seed to re-derive it from the shot list.
- **Longer journey** — `demo.json`'s `journey` accepts any number of building
  slugs (≥1): the demo opens on the first, real-navigates to each subsequent
  one, and runs the board + photo section on the last.
- **Text reveal speed** — every `text` segment reveals its text over one fixed
  window, `OUTRO.typeFrames` in `src/lib/constants.ts` (≈0.75s @30fps), followed by
  `OUTRO.hold`. Independent of text length.
- **Re-render only** — after editing Remotion source or `video.json`, just
  re-run `assemble` (reuses the existing captured assets).

## Other

- **Studio** — `pnpm studio` opens Remotion Studio for live preview.
- **Tests** — `pnpm test` (vitest). **Typecheck** — `pnpm exec tsc -p
  tsconfig.json --noEmit` (the `pnpm typecheck` script is a no-op).

## Notes & gotchas

- All generated artifacts (`out/`) are **gitignored** — nothing produced here is
  committed.
- The slow-mo screencast keeps capture wall-time bounded to avoid Chrome
  compositor throttling; if a capture comes back with too few frames, raise
  `slowmo` in `DEFAULT_TUNING` (`scripts/seed/demo-config.ts`) toward `0.5` (do not
  lower it).
- `assets:demo` asserts each look-around pan actually moved (catches a silent
  capture failure loudly).

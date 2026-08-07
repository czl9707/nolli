# Architect Spotlight reel — design spec

**Date:** 2026-08-07
**Branch:** `feat/spotlight-reel` (off `origin/main`)
**Status:** Design approved through brainstorming; awaiting spec review.

## 1. Goal

A per-architect marketing video — an editorial "meet an architect" social reel —
templated so that swapping the architect slug produces a new video. The video's
job is **discovery**: make a viewer who has never heard of the architect care
about them through their body of work. Nolli is the "go deeper" destination,
named at the end.

This replaces the previous `apps/motion` pipeline (Playwright live-journey
capture + Remotion concat), which is archived on
`origin/archive/motion-live-capture`. The new app is built fresh on this branch.

## 2. Format

- **Master:** 16:9, 1920×1080, 30 fps, h264 mp4.
- **Target surfaces:** YouTube / website hero (16:9 master); IG feed / LinkedIn / X
  via a 1:1 center crop derived from the master. (Vertical 9:16 is explicitly
  out of scope for v1.)
- **Length:** ~30 s, music-driven.
- **Theme:** dark, matching the product (`#171717` bg, `#ffffff` fg, `#b9b9b9`
  secondary, `#c0503a` accent). Theme styling is deferred (this spec covers
  structure), but the dark baseline is assumed.

## 3. Story

The narrative spine is **a body of work, revealed through geography and
chronology** — the one story only Nolli can tell, because the map is ours. It is
entirely data-driven (no copywriting required):

- Identity emerges from **accumulation**: where this person built (geography) and
  over what span (chronology).
- The architect's **name is the payoff**, not the opener. A cold social audience
  derives nothing from an unknown name at second 0, so it is earned near the end
  ("9 buildings, 4 countries, 50 years — all by one architect: …").
- The **map is a companion, never the subject.** It sits alongside the content to
  show *where the current building is* and *how the footprint grows*; it does not
  carry the story alone.

### Three synced views

The frame presents three synchronized views of one "current" item, all driven by
a single playhead (a position in the chronological building list):

1. **Info** — the current building's photo + name + year + place.
2. **Map** — the real Nolli map, flown to the current building's pin, which is
   highlighted.
3. **Timeline** — the chronological index; the current item is marked.

As the playhead advances, all three update in concert. The grid is fixed; only
`current` changes. This is what makes the flow reusable across content: swap the
architect, keep the flow.

## 4. Layout — "Magazine"

Structure only; styling deferred. 16:9 frame with breathable margins on all
sides. Four zones; the right column is the map full-height, the left column
stacks hero / caption / timeline.

```
┌──────────────────────────────────────────────────────┐
│  MASTHEAD  ·  NOLLI — ON ARCHITECTS  ··  no. 04      │  full-width top band (constant)
│ ┌────────────────────────────┬─────────────────────┐ │
│ │  HERO PHOTO  (current)     │                     │ │
│ │  the building, big          │   MAP  (real)       │ │
│ ├────────────────────────────┤   full right side,  │ │
│ │  CAPTION                   │   padding all round │ │
│ │  Barcelona Pavilion        │   all pins + flies  │ │
│ │  1929 · Barcelona, ES      │   to current pin    │ │
│ ├────────────────────────────┤                     │ │
│ │  CONTACT SHEET = TIMELINE  │                     │ │
│ │  ▢ ▢ [▣] ▢ ▢  '12 '21 '29 │                     │ │
│ └────────────────────────────┴─────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

| Zone | Holds | Driven by |
|---|---|---|
| **Masthead** (top, full width, thin) | Series wordmark + episode number. Constant across every video — the recurring identity, *not* the architect's name. | static |
| **Hero photo** (left, dominant) | The current building's photo, big — the eye lead. | `currentBuilding` |
| **Map** (right, full height, ≥1/3) | Real `ArchMap` — all pins (the body of work) + flies to the current pin, which is highlighted. | `currentSlug` |
| **Caption** (under hero) | Current building's name · year · place, as editorial type. | `currentBuilding` |
| **Contact sheet = timeline** (bottom-left, full width of column) | Small thumbnails of *all* buildings ordered chronologically; current enlarged/marked; a year strip beneath. This block **is** the chronology spine — no separate ruled timeline. | `currentIndex` |

**Rationale for the contact-sheet-as-timeline merge:** a separate ruled timeline
plus a contact sheet is redundant. The contact sheet already conveys order and
progression; folding the year strip into it removes redundancy and reads more
editorially.

**Proportions:** stage:map split defaults to 50:50 (map full height), adjustable
later. The map is a first-class visual and must never drop below 1/3 of the
frame.

## 5. Storyboard

~30 s. Each beat is just "where is the playhead + what is the camera doing."

| Beat | Time | Hero (left) | Map (right) | Contact-sheet | Job |
|---|---|---|---|---|---|
| **0. Hook** | 0–2 s | The hook building (configured; default earliest/most-photos — see §6), full attention. Masthead types in. | Pings to that building's pin. | All thumbs faintly visible (foreshadow the body of work). | Stop the scroll on a striking image + "this is a series." |
| **1. Establish** | 2–4 s | Caption writes in (name · year · place). | All pins appear; current highlighted. | Index resolves; playhead on #1. | "We're walking through a body of work." |
| **2. The walk** | 4–19 s | Swaps to each building in turn. | Flies pin → pin in chronological order; visited pins fill in, upcoming stay faint. Footprint visibly grows. | Mark advances thumb by thumb; year ticks land. | Core: geography + chronology accumulate. Rhythmic, accelerating with the music. |
| **3. The whole** | 19–23 s | Holds on the most iconic building. | Zooms out to reveal the entire footprint — every pin visited. | Fully marked. Data line resolves: `9 buildings · 4 countries · 1928–1986`. | "Look at all of that." |
| **4. Name payoff** | 23–27 s | Caption becomes the architect's **name**. | Holds the full map. | Recedes. | "…all by one architect." The earned reveal. |
| **5. CTA** | 27–30 s | `Explore [Name]'s work in Nolli`. | Fades or holds dim. | Gone. | Drive to the product. |

Pacing within the walk: roughly even per building (~1.5–2 s each for a ~9-building
architect), with the option to dwell longer on an iconic building.

## 6. Asset & data pipeline

Three steps, same shape as the archived pipeline (seed → assets → render), but
**no Playwright, no app dev server, no capture.** The map is rendered live inside
Remotion.

| Step | Does | Source |
|---|---|---|
| **`seed <slug>`** | Resolve architect + buildings (join `architecture_photos` for each cover image), auto-compute stats (`count`, distinct `country`, `min–max year`), write one config JSON: ordered buildings `[{slug, name, year, city, country, coords, heroImage, thumbImage}]` + stats + masthead episode no. | sqlite (cached `~/.nolli/latest.db`, as before) |
| **`assets <slug>`** | HTTP-fetch each building's cover image into `public/capture/<slug>/` (hero + a square thumb crop). Pure download. | R2 image URLs |
| **`render <slug>`** | Remotion composition: real `<ArchMap>` (per-frame camera + `selectedSlug` + visited set) + the magazine layout. Reads the config + staged images. | config + `@nolli/map` |

**Data model used** (verified against `packages/data`):

- `architectures` → `slug, name, year, latitude, longitude, city, country, architect`
- `architecture_photos` → `image (URL), caption, width, height, is_cover` — multiple
  per building; `is_cover = 1` selects the canonical cover. (These are the R2-hosted
  photos the seed pipeline already harvested.)

**Computed vs. configured:**

- **Auto-computed** (zero manual work per architect): building list + order, the
  stats line, pin positions, year ticks.
- **Config-editable defaults**: which building is the hook/iconic one (default:
  earliest, or the building with the most photos — selectable in the config), and
  the masthead episode number.

## 7. The map in Remotion (key architecture decision)

The map is the **real Nolli `ArchMap`** rendered inside Remotion, driven
deterministically per frame. This dominates both alternatives (static map render
/ app screenshot): brand-identical, no Playwright, no tile-timing flakiness,
frame-accurate camera moves.

`ArchMap` (`packages/map`) is already built for this:

- `architectures: ArchSummary[]` — the collection as markers.
- `selectedSlug` — highlight the current pin (driven per-frame).
- `onArchClick` — omit for non-interactive markers.
- `capture?: boolean` — sets `preserveDrawingBuffer: true` so the WebGL canvas
  reads back to image (the team already anticipated capture).
- `forwardRef<MapRef>` — exposes the maplibre instance for imperative camera.

Per-frame driving pattern:

- Do **not** use `flyToArchCinematic` (wall-clock). Instead compute interpolated
  `center`/`zoom` from `useCurrentFrame()` and call `mapRef.current.jumpTo(...)`
  each frame. Reuse `map-flyto`'s easing/target-zoom math so the move *looks* like
  the app's cinematic flyTo.
- `delayRender()` until the map's `load` event, then `continueRender()` so tiles
  are present before each frame screenshot.
- `selectedSlug` switches per frame from the playhead; markers reflect three
  states (visited / current / upcoming).

## 8. Risks & open details (to resolve in the implementation plan)

1. **Headless WebGL in the render env.** Remotion's Chromium supports WebGL and
   `capture:true` handles canvas readback, but WebGL init can require `--gl=angle`
   / swiftshader in some containers. **Mitigation:** a 1-frame render spike
   (`<ArchMap capture>` → still PNG) early, before building the full composition.
2. **Three-state markers.** `ArchMap` has `selectedSlug` (current) but the
   visited/upcoming distinction needs markers to reflect a set. Likely rides on
   the existing clustering/marker layer; validate it's cheap.
3. **Per-frame flyTo cost.** Beat 2 flies between ~9 buildings in one composition —
   the most render-expensive part and the real stress test for the WebGL path.
4. **Theme store.** `ArchMap` reads `useThemeStore` (dark/light); the Remotion
   composition has no app shell, so it needs a provider wrapper pinned to `dark`.
5. **Big architects (30+ buildings).** The contact sheet can't show all legibly.
   Default: a scrolling window — current thumb centered, neighbors visible, year
   strip tracking. Small architects show the full row.
6. **Varying cover-image aspect ratios.** Hero block and square thumbs
   `object-fit: cover`-crop; no manual reformatting.

## 9. Out of scope (v1)

- **Pin Board layout** (concept A) — reusing the app's dot-grid PinBoard canvas.
  Deliberate phase 2: the most Nolli-native look, but the most Remotion
  choreography work. Build once the magazine pipeline is proven.
- **Vertical 9:16** (Reels/TikTok/Shorts).
- **Curated editorial copy** per architect (philosophy quotes, biography). The v1
  story is fully data-derived. A future "one idea, many buildings" series would
  add a ~1-sentence curated layer.
- **Live app interaction** in the video. The map is camera-only (center/zoom);
  no click/drag/pan captured.

# Nolli landing — production app

One-page scroll landing for the architecture map. A single sticky dark map
layer is driven by two clocks:

1. **Scrub morph** (`src/stage/timeline.ts`) — the layer's real % left/top/width/height
   is a pure function of scroll progress (container-geometry morph, the app
   technique); MapLibre `trackResize` re-renders natively. Stopping anywhere
   freezes a valid frame. Canvas trails the container ~1 frame during scrub
   (ResizeObserver async) — clipped by overflow hidden, invisible in practice.
2. **Cinematic flights** (`stage/stage.tsx` + `@nolli/map` `flyToSceneCinematic`) —
   fired per scene via `useSceneCamera` (`stage/hooks.ts`) when the timeline's
   camera keyframe changes, per-frame-source cameras from
   live data (`landing-data.ts`, `constants.ts`).

Scenes: hero (Paris dwell, cursor plate reveal over the bare map, split-rails
copy, diagonal grade) → index (city-list column + standalone map plate,
click a city to fly there) → cta (hero-mirror grade) → footer (cream block
rising over the south ocean, normal flow). Mobile/reduced-motion swap the
scrub for snapped keyframes. Design + wiring specs (local, gitignored):
`docs/superpowers/specs/2026-08-21-landing-page-design-direction.md`,
`docs/superpowers/specs/2026-08-20-landing-page-design.md`, plan in
`docs/superpowers/plans/2026-08-21-landing-page.md`. The prototype round the
first scenes came from is archived at commit 439ad33.

## Site header

`components/site-header.tsx` — topline bar (mark + hand wordmark left,
Poster/About placeholder links + the app's `@nolli/ui` Button CTA right).
Portaled to `document.body` from the stage: the scene overlays paint above
the sticky stage, so an in-stage header would sit under them. `opacity = 1 -
fade("footer")` with a visibility kill for the
hit test; the bar passes pointer events through to the map. Placeholder
links point at `#` until the poster app / about pages exist.

## Hero cursor reveal

`scenes/hero.tsx` (`HeroReveal`) — the hero dwell shows the bare Paris map
(`HERO_CAMERA`, pins off) under a dim veil. A plate (360×280,
`var(--size-border-radius)`) spring-follows the cursor; the veil carries the
diagonal ink gradient with the plate's rect punched out (mask), the plate
gets a hairline border + slight brightness lift. The photo markers render
fully but are clipped to the plate
rect (per-marker `inset()` clip-path on the marker content divs, matched via
the shared `scenes/index.markers.module.css` class, rAF-throttled on pointer-spring
+ camera change) — straddling markers crop at the plate edge. Everything
fades with `fade("hero")`; clips release below hero fade 0.5 so the markers fade out through the hero
var while the plate dissolves (the grade and layer morph of the hero→index
handoff are untouched). Snap mode (touch/reduced-motion) has no cursor: no
plate or veil, markers show unclipped.

Each scene owns the markers it shows. `scenes/hero.tsx`
(`HeroPhotoMarkers`) mounts the Paris picks (`.heroMarker` class) clipped to
the plate, fades them out with the veil exit, and hands a BARE map to the
index — whose `IndexPhotoMarkers` arrive after the landing flight (ramp
30→70vh). Fade vars are per-owner (`--hero-photo-o` / `--index-photo-o`,
initialized to 0 on the map container at map-ready); the shared container
flags (`data-photo-markers` / `data-arch-markers` / `data-hero-plate`) are
written by whichever scene owns the screen, gated on global scroll at the
scene seam.

## Index — city list + standalone plate

`scenes/index.tsx`. The map layer settles into a standalone plate
(`slots.ts` `indexPlate`: right of a 26% column, page margin on all sides,
site-header clearance above; `IndexFrame` draws its hairline). The
flow-mounted `IndexPanel` is the winning "city dossier" layout from the
2026-08-27 variant round (A editorial / B dossier / C numbered rail, built
switchable then folded): selected city leads huge, the statement sits
mid-column, the compact city list anchors the bottom. Hand-picked 6 cities,
name-only rows (Paris first — continuity with the hero); click →
`fitCamera` on the city's farthest-point picks into the plate px →
`stage.flyTo`, and `IndexPhotoMarkers` swap to that city. The two-column
assembly (column + plate) is capped at 1400px and centered (`indexPlate`).
Copy: "Don't miss the masterpiece / Google Maps treats a masterpiece no
differently. ArchDaily curates everything about it. Nolli pins it on the
map."
Paris comes free with the landing data; other cities preload once via
filter options.

## Landing redo

The 2026-08-30 redo round shipped as the production spine — hold/transition
scenes, measured shapes, boundary flights. The throwaway prototype that
settled the direction (variant A "Ledger") is deleted. Design doc (local,
gitignored): `docs/superpowers/specs/2026-08-31-landing-map-spine-design.md`.

## Dev

`pnpm --filter landing dev` needs a local db: copy `latest.db` into
`public/` and run with `VITE_R2_PUBLIC_DB_URL=` (empty) so the data layer
fetches `/latest.db` from Vite instead of R2. The db and generated
`public/patterns/` are gitignored.

Dev-only caveat: `PhotoMarker`'s `crossOrigin="anonymous"` fails against
`images.nolli-map.com` without CORS headers, so polaroid photos 404 on
localhost (clips/layout still verifiable). Same-origin in production,
unaffected.

## Open content items (deliberately carried, not built)

- footer copy + link set (placeholders point at `#`)
- header nav targets (poster app, about page)
- mobile layout for the index two-column (26% column is unreadable narrow;
  needs a stacked plate + horizontal city chips pass)
- prerendered shell / static first-paint for hero — REQUIRED before deploy
  (live db load means no-JS crawlers and slow links see only "loading the
  map…")

## Known accepted pause

cta→footer handoff: cta copy lingers across its whole outgoing transition
(footer is flow-mounted, no crossfade), but the footer block arrives a few
vh after cta fully fades — a short quiet beat (~3vh of scroll) while the map
finishes its south flight. Read as flight dwell; revisit only if it bothers.

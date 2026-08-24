# Nolli landing — production app

One-page scroll landing for the architecture map. A single sticky dark map
layer is driven by two clocks:

1. **Scrub morph** (`src/lib/spine.ts`) — the layer's real % left/top/width/height
   is a pure function of scroll progress (container-geometry morph, the app
   technique); MapLibre `trackResize` re-renders natively. Stopping anywhere
   freezes a valid frame. Canvas trails the container ~1 frame during scrub
   (ResizeObserver async) — clipped by overflow hidden, invisible in practice.
2. **Cinematic flights** (`stage.tsx` + `@nolli/map` `flyToSceneCinematic`) —
   fired when the spine's target scene changes, per-frame-source cameras from
   live data (`landing-data.ts`, `constants.ts`).

Scenes: hero (Paris dwell, cursor plate reveal over the bare map, split-rails
copy, diagonal grade) → index (light page, framed map slot + photo cards
pinned to map coords) → cta (hero-mirror grade) → footer (cream block rising
over the south ocean, normal flow). Mobile/reduced-motion swap the scrub for
snapped keyframes. Design + wiring specs (local, gitignored):
`docs/superpowers/specs/2026-08-21-landing-page-design-direction.md`,
`docs/superpowers/specs/2026-08-20-landing-page-design.md`, plan in
`docs/superpowers/plans/2026-08-21-landing-page.md`. The prototype round the
first scenes came from is archived at commit 439ad33.

## Site header

`components/site-header.tsx` — topline bar (mark + hand wordmark left,
Poster/About placeholder links + the app's `@nolli/ui` Button CTA right).
Portaled to `document.body` from the stage: the hero flow block (and its
grade) paints above the sticky stage, so an in-stage header would sit under
the gradient. `opacity = 1 - fade("footer")` with a visibility kill for the
hit test; the bar passes pointer events through to the map. Placeholder
links point at `#` until the poster app / about pages exist.

## Hero cursor reveal

`components/hero-reveal.tsx` — the hero dwell shows the bare Paris map
(`HERO_CAMERA`, pins off) under a dim veil. A plate (360×280,
`var(--size-border-radius)`) spring-follows the cursor; the veil is the
plate's own giant box-shadow, the inside gets a hairline border + slight
brightness lift. The photo markers render fully but are clipped to the plate
rect (per-marker `inset()` clip-path on the marker content divs, matched via
the shared index-photo-markers module class, rAF-throttled on pointer-spring
+ camera change) — straddling markers crop at the plate edge. Everything
fades with `fade("hero")`; clips release below hero fade 0.5 so the markers
crossfade in via the index fade while the plate dissolves (the grade and
layer morph of the hero→index handoff are untouched). Snap mode
(touch/reduced-motion) has no cursor: no plate or veil, markers show
unclipped.

`components/index-photo-markers.tsx` gates the marker sets: photo markers own
the screen during hero AND index (`data-photo-markers` /
`data-arch-markers`); `data-hero-reveal="on"` forces full marker visibility
while the plate clip does the gating.

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
- prerendered shell / static first-paint for hero — REQUIRED before deploy
  (live db load means no-JS crawlers and slow links see only "loading the
  map…")

## Known accepted pause

cta→footer handoff: cta copy lingers across its whole outgoing transition
(footer is flow-mounted, no crossfade), but the footer block arrives a few
vh after cta fully fades — a short quiet beat (~3vh of scroll) while the map
finishes its south flight. Read as flight dwell; revisit only if it bothers.

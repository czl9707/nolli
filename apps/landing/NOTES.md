# Nolli landing — production app

One-page scroll landing for the architecture map. A single sticky dark map
layer is driven by two clocks:

1. **Scrub morph** (`src/lib/spine.ts`) — layer scale/offset is a pure
   function of scroll progress; stopping anywhere freezes a valid frame.
2. **Cinematic flights** (`stage.tsx` + `@nolli/map` `flyToSceneCinematic`) —
   fired when the spine's target scene changes, per-frame-source cameras from
   live data (`landing-data.ts`, `constants.ts`).

Scenes: hero (diagonal grade) → index (light page, framed map slot + photo
cards pinned to map coords) → closeup (rotating quilt board around a
transparent map window) → cta (hero-mirror grade) → footer (cream block
rising over the south ocean, normal flow). Mobile/reduced-motion swap the
scrub for snapped keyframes. Design + wiring specs (local, gitignored):
`docs/superpowers/specs/2026-08-21-landing-page-design-direction.md`,
`docs/superpowers/specs/2026-08-20-landing-page-design.md`, plan in
`docs/superpowers/plans/2026-08-21-landing-page.md`. The prototype rounds the
scenes came from are archived at commit 439ad33.

## Dev

`pnpm --filter landing dev` needs a local db: copy `latest.db` into
`public/` and run with `VITE_R2_PUBLIC_DB_URL=` (empty) so the data layer
fetches `/latest.db` from Vite instead of R2. The db and generated
`public/patterns/` are gitignored.

## Open content items (deliberately carried, not built)

- footer copy + link set (placeholders point at `#`)
- CJK font for 世界的尽头 — currently falls back from the handwriting face
- closeup micro-CTA deep-link format (`shape.ts` `boardCtaLabel` → `APP_URL`)

## Known accepted pause

cta→footer handoff: cta copy lingers across its whole outgoing transition
(footer is flow-mounted, no crossfade), but the footer block arrives a few
vh after cta fully fades — a short quiet beat (~3vh of scroll) while the map
finishes its south flight. Read as flight dwell; revisit only if it bothers.

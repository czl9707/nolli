# PROTOTYPE — section-design playground

Throwaway UI prototype (per `prototype` skill). Question: **what should each
landing section look like as a standalone static screen, before any scroll
animation wiring?**

- Switch sections/variants: `?section=hero|index|closeup|cta&variant=A|B|C`,
  or the floating bottom bar (← → cycles variants).
- `pnpm --filter landing dev`
- Real deps: live `ArchMap`, baked `public/landing-data.json`, `@nolli/ui`
  tokens. Config + data mechanics restored from `archive/landing-app-v1`.
- Not production code. Winner gets rewritten properly when folded in.

## Verdicts

Round 2 (2026-08-21, user):

- hero: **A layout (survey)** + **B's bolder scrim** → merged into A: tall bottom-anchored
  grade (200dvh, clipped at fold — no hard bottom edge; dark mass stays low so the map
  reads as revealed from behind on scroll). B/C dead.
- index: direction **A (scatter)**, evolved into **D — framed map**: map leaves fullscreen,
  becomes bordered-radius picture (app language); statement hangs over the frame's top-left
  corner. A/B/C dead. Known: two left-cluster cards overlap (adjacent real coords).
- closeup: **A (pin-board)**. Content reworked: handwriting note = the statement itself
  (top-left), map slot below it, captioned big photo + tall + wide photos right, metadata
  card bottom-right. B dead.
- cta: **A (bookend)** with hero-style tall grade; footer = thin strip inside the scene
  (wordmark + tagline left, link right). B dead.

Open: footer link set (app only right now — instagram? mail?); index D photo overlap +
card size; closeup top-heaven balance.

Round 4 (2026-08-21, user) — SETTLED:

- hero: **D diagonal grade** (dark TL → BR, text left-middle nudged down).
- index: **E light mode** — text above the map card on cream, no scrim.
- closeup: **A pin-board + light mode** (bg goes cream like index E; detailed layout
  session still pending).
- cta: **A hero mirror**, marginalia removed.
- footer: **G end of the map** (round 5) — far-south camera, no pins, "end of the map ·
  世界的尽头" annotation, block covers map bottom edge. Continuity rule: footer bg =
  CTA grade darkest stop (#1E1E1E), no border/shadow — seamless scroll-down out of CTA.

Round 6 (2026-08-21, user + pair) — closeup board content SETTLED:

- closeup A reworked into **rotating quilt board**: `data.boardSet` (5 Paris archs,
  distinct architects — pompidou/cité de refuge/quai Branly/PCF HQ/Louis Vuitton),
  one at a time, auto-rotate 5s + note-style `[← name →]` controller w/ counter.
  On switch: cards keep anchor positions, board re-settles (per-arch transform vars),
  photos/captions/map label crossfade, site map jumpTo masked by paper-fade.
- Meta card = contextual micro-CTA: "more by {architect} →" (city fallback when
  architect has 1 work). Deep-link href placeholder — verify app URL shapes later.
- Gotchas found: `App` called `current.el({data})` inline (hooks leaked into App →
  rules-of-hooks crash once a variant used hooks) — now `<current.el data={data}/>`;
  ArchMap never forwards `onViewportChange`, so controlled `viewport` prop only sets
  the INITIAL camera — live moves need a `useMap()` jumper child calling `jumpTo`.

VISUAL DESIGN WRAPPED 2026-08-21. Remaining: footer copy/links/annotation wording,
per-section cameras, closeup deep-link format + spine rotation behavior, then scroll
wiring plan.

# Landing redo prototype

Question: how do hero + index + header read recomposed as isolated 100svh
scenes on a 6-col + margin cell grid, map as background or cell, cursor
reveal kept? Map-as-spine scroll wiring deliberately absent (later phase).

Three variants at `/prototype.html`, switchable via `?variant=A|B|C` + the
floating bottom bar:

- **A — Ledger**: ruled cells over a full-bleed map (gallery-faithful)
- **B — Plate**: the map as a cell object on the paper page
- **C — Poster**: full-bleed map, type as overlays, no rules

Run: `pnpm --filter landing dev`, open `/prototype.html`. Flags:
`&mock=1` (db-free picks), `&static=1` (900px scenes for capture).
Full notes in `../../NOTES.md` ("Landing redo prototype" section).

## Verdict (2026-08-30) — A "Ledger" wins

Dark-mode app, 12-col + margin grid, recursive pane splits
(`grid.tsx`: Screen/HSplit/VSplit/Pane; `--pad`, `--col-width` exposed;
sibling borders are the split lines). Hero: full-screen dark map under a
solid-ink veil with the cursor plate punched out, plate clamped to the
top-left pane, crosshair guides (full-width/height) at its edges, pick list
+ nearest caption left-aligned in the right column, map camera fit to the
pane so the photo cards live inside the reveal. Index (80svh): city dossier
left, 2x3 city-button panes (plain divs), map pane right with unclipped
photo markers. Header: full-width frosted strip, no side pad.

B and C are rejected direction sketches — delete when folding A into the
real app. Next phase: map-as-spine scroll wiring between the two scenes
(this session continues post-compact).

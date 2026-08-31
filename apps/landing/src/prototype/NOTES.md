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

Verdict: (fill in once a variant wins)

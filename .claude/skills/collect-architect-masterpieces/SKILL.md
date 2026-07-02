---
name: collect-architect-masterpieces
description: Investigate and collect an architect's landmark buildings into the project's seed-data format — scripts/data/{slug}/ directories of meta.json + images. Use when adding an architect's works to the map, e.g. "collect Tadao Ando's masterpieces", "seed Zaha Hadid's buildings", or when working through the Pritzker laureate roster. Runs the full workflow — research the oeuvre, select landmark works (all major landmarks plus architecture-community-famous pieces), gather facts and high-quality images (prefer Arch-Eyes, Divisare, and Dezeen; ArchDaily / Unsplash as fallback, never Wikimedia), write each meta.json, and validate with `npm run seed:dry`. Stops before the real DB/R2 seed.
---

# Collect Architect Masterpieces

Produce seed data for one architect's landmark buildings. Each building becomes a
`scripts/data/{slug}/` directory holding `meta.json` plus image files, shaped per
[references/meta-json-reference.md](references/meta-json-reference.md). Depth is **comprehensive**:
every major landmark plus works famous in the architecture community, bounded by imageability
(3 for a thin oeuvre, 8–10+ for a prolific one).

## Inputs & scope

- Takes one `<architect>` — a name, or a row in the current tracking doc
  (e.g. `docs/seed-data-pritzker-roster.md`).
- If the tracking doc has a row for this architect, use it for the canonical
  `architect`/`architectCountry` strings, flagged nuances, and the end-of-run status update.
  Otherwise run standalone.
- **Scope boundary:** investigate → select → collect → validate → (optional) roster update.
  **Stop before the real seed.** `npm run seed` (Supabase + R2 upload) is secret-gated and
  irreversible; the user runs it separately. Never mark a roster row ☑ — that status is reserved
  for after the real seed.

## Phase 1 — Scope & name

- Locate the architect (tracking-doc row or freeform).
- Lock the canonical `architect` string. **Partnerships use the firm name** (`Herzog & de
  Meuron`, `SANAA`, `RCR Arquitectes`, `Lacaton & Vassal`, `Grafton Architects`); individuals use
  the person's name.
- Lock `architectCountry` as a **full country name** (e.g. `France`) — the country the architect
  is professionally associated with.
- Resolve flagged naming nuances (Bunshaft → SOM or individual?; Wang Shu → individual vs
  *Amateur Architecture Studio*; recent-name spellings). Record each decision.

## Phase 2 — Investigate oeuvre

Build a broad candidate list (name, city, year, one-line significance). Sources: Wikipedia
(facts), the Pritzker citation page, ArchDaily / Architectural Record / Dezeen profiles, and the
firm's own site. Cast wide here; filter next.

## Phase 3 — Select

- Apply the [selection rubric](#selection-rubric) to filter to the keep set.
- **Review gate (default on):** surface the keep/drop list with reasons for a user nod before
  collecting. Skip the gate only if told to proceed.

## Phase 4 — Collect each building

For each kept building, create `scripts/data/{slug}/`:

- Fill `meta.json` per the [field source map](#field-by-field-source-map) and the schema in
  [references/meta-json-reference.md](references/meta-json-reference.md).
- Source ≥1 high-quality image; download into the dir as `photo-01.jpg`, `photo-02.jpg`, …; set
  `coverImage` to the strongest.
- Do **not** add `notes` — start at 0 notes.

## Phase 5 — Validate

- Cross-check `latitude`/`longitude` against **OpenStreetMap**: geocode the building/address via
  Nominatim, or place the point on openstreetmap.org. The pin must land on the actual structure;
  if Google and OSM disagree, investigate and keep the correct one.
- Run `npm run seed:dry` and fix every error until clean. (The seed script skips dirs with no
  valid `meta.json`, so the existing empty dirs are harmless.)
- Confirm every [done-gate](#done-gates) holds.

## Phase 6 — Bookkeeping (only if a tracking doc exists)

Update the architect's row: Status → ◐, `# Bldgs` → count, append
`(collected YYYY-MM-DD, awaiting seed)`. Record any new nuances discovered. Do **not** set ☑.

## Selection rubric

**Include** a building if it meets any:

- a defining/signature work — the one building they're known for
- canonical in architectural education/history (textbook case study)
- major award or widely published (AIA/RIBA, monograph centerpiece)
- represents a distinct career phase, typology, or signature material/technique
- famous within the architecture community even if not mainstream

**Drop/flag** minor or ancillary works, unrealized competition entries, disputed attribution, or a
typology already represented by a stronger example. **Fame-and-imageability gate:** if a building
has essentially no good online imagery, flag it low-priority rather than emit a thin entry.

## Field-by-field source map

| Field | Source / rule |
|---|---|
| `name` | building's common display name |
| `architect`, `architectCountry` | fixed in phase 1 (partnerships = firm name; country = full name) |
| `year` | completion year (Wikipedia / firm site) |
| `address`, `city`, `country` | Google Maps / Wikipedia; `country` = ISO-2 (e.g. `JP`) |
| `latitude`, `longitude` | Google Maps / Wikipedia, then cross-check vs OpenStreetMap |
| `googleMapsUrl` | `https://www.google.com/maps?q=` + URL-encoded `Name, City, Country` |
| `coverImage` | strongest image filename (e.g. `photo-01.jpg`) |
| `notes` | **omit** (start at 0) |
| `links` | always a `wikipedia` link when one exists; plus `archdaily` and/or `custom` (Dezeen / firm page) |

Full field types, required flags, and link/image rules live in
[references/meta-json-reference.md](references/meta-json-reference.md) — read it when assembling
each `meta.json`.

## Image sourcing

- **Prefer:** Arch-Eyes (archeyes.com), Divisare (divisare.com), and Dezeen (dezeen.com) — they
  consistently offer the cleanest, most artful architectural photography and reliable direct image
  URLs. Try these first.
- **Use as fallback:** ArchDaily, Unsplash (prefer Unsplash when a strong free shot exists). Match
  the project's quality bar.
- **Never** Wikimedia Commons.
- Download with `curl`; name `photo-01.jpg`, `photo-02.jpg`, …; aim for 1–4 per building.
- Architectural photography is editorial and copyrighted; the project accepts this tradeoff for
  quality. Do not block on licensing.

## Slug convention

kebab-case of the building's common name, accents/diacritics stripped, mirroring existing slugs
(`church-of-the-light`, `sendai-mediatheque`, `centre-pompidou`). Unique; disambiguate on
collision; dedupe against the existing slugs (including the 5 already-seeded modernists).

## Done-gates

All must hold:

- `npm run seed:dry` passes clean.
- Every required `meta.json` field present; `notes` omitted.
- `country` is valid ISO-2.
- `latitude`/`longitude` are numeric, cross-checked vs OpenStreetMap, and land on the building.
- `googleMapsUrl` is a `q=` query.
- `coverImage` resolves to a real file in the dir; ≥1 image per dir.
- No duplicate slug; no collision with existing entries.

## Edge cases

- **Prolific** (Ando, Foster, Piano, Koolhaas) → larger keep set; warn the count.
- **Thin / regionally-concentrated** (Murcutt, Fehn, Kéré, Aravena) → fewer entries; correct, not
  a failure.
- **Missing / unverifiable data** → never fabricate coordinates; flag the building blocked and
  skip-or-note.
- **Partnership attribution** → decide in phase 1 and record it (SANAA, RCR, Herzog & de Meuron,
  Lacaton & Vassal, Grafton; Bunshaft vs SOM; Wang Shu vs Amateur Architecture Studio).

## References

- [meta-json-reference.md](references/meta-json-reference.md) — the output data shape (fields,
  link types, image rules). Read when assembling each `meta.json`.
- Tracking doc (e.g. `docs/seed-data-pritzker-roster.md`) — canonical names, flagged nuances, and
  status; used only when present.

# Collect Architect Masterpieces — Skill Design

- **Date:** 2026-06-13
- **Status:** Approved (pending implementation plan)
- **Branch:** `docs/collect-architect-masterpieces-skill`
- **Related:** [`docs/seed-data-pritzker-roster.md`](../../seed-data-pritzker-roster.md) (current tracking doc, transient)

## Overview

A project-local skill that drives the full workflow for **investigating and collecting
the masterpieces of a single architect** into the seed-data format. For each architect it
produces a set of `scripts/data/{slug}/` directories (`meta.json` + image files) that conform
to the bundled `meta.json` reference (see [Skill file layout](#skill-file-layout)), validates them, and updates the
tracking doc.

Per-architect depth is **comprehensive**: every major landmark **plus** works that are
famous within the architecture community — bounded by imageability. Depth varies per
architect (3 for a thin oeuvre, 8–10+ for a prolific one); the rubric below decides what
counts, not a fixed quota.

## Skill identity

- **Name:** `collect-architect-masterpieces`
- **Location:** `.claude/skills/collect-architect-masterpieces/SKILL.md` (+ `references/`)
- **Invocation:** `/collect-architect-masterpieces <architect>` — the architect's name. If a
  tracking doc with a row for this architect is present, it is used for canonical name/country
  strings, flagged nuances, and status updates; otherwise the skill runs standalone.
- **Scope boundary:** investigate → select → collect → validate → (optional) roster bookkeeping.
  The skill **stops before the real DB/R2 seed** — that step is secret-gated and irreversible,
  and is triggered separately by the user via `npm run seed`.

## Pipeline (6 phases)

### Phase 1 — Scope & name
- Locate the architect (tracking-doc row or freeform).
- Lock the canonical `architect` string per roster conventions: **partnerships use the firm
  name** (`Herzog & de Meuron`, `SANAA`, `RCR Arquitectes`, `Lacaton & Vassal`, `Grafton
  Architects`); individuals use the person's name.
- Lock `architectCountry` as a **full country name** (e.g. `France`), the country the architect
  is professionally associated with.
- Resolve flagged naming nuances (Bunshaft → SOM or individual?; Wang Shu → individual vs
  *Amateur Architecture Studio*; recent-name spellings). Record each decision.

### Phase 2 — Investigate oeuvre
- Research the body of work; build a **broad candidate list** (name, city, year, one-line
  significance).
- Sources: Wikipedia (facts), the Pritzker citation page, ArchDaily / Architectural Record /
  Dezeen profiles, the firm's own site.

### Phase 3 — Select (rubric + optional review gate)
- Apply the [selection rubric](#selection-rubric) to filter candidates to the keep set.
- **Optional review gate:** surface the keep/drop list (with reasons) for a user nod before
  doing the collection work. Skip the gate only when explicitly told to proceed.
- Record the reason for borderline drops.

### Phase 4 — Collect each building
For each kept building, produce one `scripts/data/{slug}/` directory:
- Gather every `meta.json` field per the [field source map](#field-by-field-source-map).
- Source ≥1 high-quality image and download it into the dir (`photo-01.jpg`, `photo-02.jpg`, …);
  set `coverImage` to the strongest.
- Write `meta.json`. **Do not generate `notes`** (see field map).

### Phase 5 — Validate
- Cross-check `latitude`/`longitude` against **OpenStreetMap** (Nominatim geocode of the
  building/address, and/or the point on openstreetmap.org) — the pin must land on the actual
  structure. If Google and OSM disagree, investigate and keep the correct one.
- Run `npm run seed:dry` to validate; fix shape errors until it passes clean (see [done-gates](#output--done-gates)).

### Phase 6 — Bookkeeping (roster-optional)
- **Only if** a tracking doc with this architect exists: update its row — Status → ◐,
  `# Bldgs` → count, append `(collected YYYY-MM-DD, awaiting seed)`. Add any new per-architect
  nuances discovered.
- **Never** mark ☑ — that is reserved for after the real seed.

## Selection rubric

**A building is IN if it meets any of:**
- A defining/signature work — "the one building you know them by."
- Canonical in architectural education/history (textbook case study).
- Major award or widely published (AIA/RIBA, monograph centerpiece).
- Represents a distinct career phase, typology, or signature material/technique.
- Famous within the architecture community even if not mainstream-known.

**Drop / flag:** minor or ancillary works, unrealized competition entries, works of disputed
attribution, or a typology already represented by a stronger example.

**Fame-and-imageability gate:** if a building has essentially no good online imagery, flag it
as low-priority rather than producing a thin entry. (The project targets buildings famous enough
that good images exist.)

## Field-by-field source map

| Field | Rule |
|---|---|
| `name` | Building's common display name. |
| `architect`, `architectCountry` | Fixed in phase 1 (canonical strings). |
| `year` | Completion year (Wikipedia / firm site). Use built/completed. |
| `address`, `city`, `country` | Google Maps / Wikipedia. `country` is **ISO-2** (e.g. `JP`). |
| `latitude`, `longitude` | Derive from Google Maps / Wikipedia, then **cross-check via OpenStreetMap** (phase 5). Decimal degrees. |
| `googleMapsUrl` | Google Maps **`q=` search query**: `https://www.google.com/maps?q=<URL-encoded "Name, City, Country">`. No place-ID resolution needed. |
| `coverImage` | Filename of the strongest image (e.g. `photo-01.jpg`). |
| `notes` | **Omit.** Start with 0 notes; never generate. |
| `links` | Always include a `wikipedia` link when one exists; plus `archdaily` and/or `custom` (Dezeen / firm page). |

## Image sourcing protocol

- **Preferred sources:** Dezeen, Arch-Eyes, ArchDaily, Divisare, Unsplash. Prefer **Unsplash**
  where a strong free shot exists.
- **Never Wikimedia Commons** (below the project's quality bar).
- Download via `curl` into the slug dir as `photo-01.jpg`, `photo-02.jpg`, …; aim for 1–4 images.
- **Licensing note (baked into the skill):** Dezeen / ArchDaily photos are editorial and
  copyrighted. The project accepts this tradeoff for image quality; the skill prefers Unsplash
  when a strong free shot exists but does not block on licensing.

## Slug convention

kebab-case of the building's common name, accents/diacritics stripped, mirroring existing
patterns (`church-of-the-light`, `sendai-mediatheque`, `centre-pompidou`). Unique; disambiguate
on collision; dedupe against the 50 existing slugs (including the 5 already-seeded modernists).

## Output & done-gates

**Output per architect:** N × `scripts/data/{slug}/{meta.json, photo-0X.*}`, one clean dry-run,
one tracking-doc row update (if a tracking doc exists).

**Done-gates (all must hold):**
- Dry-run passes clean.
- Every required `meta.json` field present; `notes` omitted.
- `country` is valid ISO-2.
- `latitude`/`longitude` are numeric, **cross-checked against OpenStreetMap**, and land on the
  actual building.
- `googleMapsUrl` is a `q=` query.
- `coverImage` resolves to a real file in the dir; ≥1 image per dir.
- No duplicate slug; no collision with existing entries.

## Edge cases

- **Prolific laureates** (Ando, Foster, Piano, Koolhaas) → larger keep set; warn the count.
- **Thin / regionally-concentrated oeuvres** (Murcutt, Fehn, Kéré, Aravena) → fewer entries;
  that is correct, not a failure.
- **Missing / unverifiable data** → **never fabricate coordinates**; flag the building as blocked
  and skip-or-note it.
- **Partnership attribution** decided in phase 1 and recorded.

## Roster decoupling

The core pipeline (phases 2–5) is **roster-agnostic**. The tracking doc
(`docs/seed-data-pritzker-roster.md` today) is **transient and per-task** — it changes over time.
The skill reads it only when present and only for an architect it contains: phase 1 uses its
canonical strings + flagged nuances; phase 6 updates its status. With no matching tracking doc,
the skill runs standalone and phase 6 is a no-op.

## Reference move

Move `docs/seed-data-reference.md` →
`.claude/skills/collect-architect-masterpieces/references/meta-json-reference.md` so the skill
carries its own output contract (self-contained). Update the two inbound links in the roster doc
to the new relative path. **No code references the file** (verified); only the roster doc links
to it.

## Skill file layout

```
.claude/skills/collect-architect-masterpieces/
├── SKILL.md
└── references/
    └── meta-json-reference.md   # moved from docs/seed-data-reference.md
```

`SKILL.md` references the bundled `meta-json-reference.md` and the tracking doc by path rather
than duplicating their content.

## Verified during design

- **Seed script tolerates dirs without `meta.json`.** `scripts/seed-architectures.ts` reads each
  slug dir's `meta.json` in a try/catch and logs `Skipping <slug>: no valid meta.json` on failure
  (lines 250-253), so the 50 locally-empty dirs do not cause errors. `npm run seed:dry` validates
  the whole `scripts/data/` dir safely — no structural fix needed.
- **Npm commands** (`package.json`): `npm run seed:dry` (dry-run validation, used by the skill)
  and `npm run seed` (real DB/R2 seed — user-triggered, out of skill scope).

## Out of scope (YAGNI)

- Running the real seed.
- Licensing enforcement beyond the preference note.
- Automated building discovery beyond the rubric.
- Generating `notes`.
- A heavyweight research-dossier artifact (the optional review gate replaces it).

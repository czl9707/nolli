# Supabase Database Schema Design

> Date: 2026-05-27
> Status: Approved
> Supersedes: `docs/2026-05-27-supabase-data-layer-design.md` (schema section only)

## Summary

Refined database schema for Nolli's Supabase backend. Key changes from the original design doc:

- Lookup tables for architects, cities, countries (was plain text)
- Single architect per building via FK (was text)
- Year as integer (was text with ranges)
- Cover image moved to photos table with `is_cover` flag (was columns on architectures)
- No `architecture_pages` table — pages data is unused in the app; cover is now a photo flag
- Unified links table with type enum (was typed columns + custom links)
- No search_vector (removed from architectures)
- No suggestions table (deferred)
- No tags/styles (deferred)
- Timestamps on all non-lookup tables

## Schema

### `countries`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `code` | `text` | unique, not null | ISO 3166-1 alpha-2, e.g. "US", "JP" |
| `name` | `text` | not null | Display name, e.g. "United States" |

### `cities`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | not null | e.g. "New York" |
| `country_id` | `uuid` | FK → countries, not null | |

Unique index on `(name, country_id)`.

### `architects`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | unique, not null | e.g. "Ludwig Mies van der Rohe" |

### `architectures`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `slug` | `text` | unique, not null | URL identifier |
| `name` | `text` | not null | Building name |
| `architect_id` | `uuid` | FK → architects, not null | |
| `year` | `integer` | not null | Year designed |
| `address` | `text` | not null | Full address |
| `city_id` | `uuid` | FK → cities, not null | |
| `coordinates` | `geography(POINT, 4326)` | not null | PostGIS point for bbox queries |
| `google_maps_url` | `text` | not null | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | auto-updated via trigger | |

Indexes:
- unique on `slug`
- GiST on `coordinates` (PostGIS spatial index)
- btree on `year`
- btree on `architect_id`
- btree on `city_id`

### `architecture_photos`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `architecture_id` | `uuid` | FK → architectures, not null, cascade delete | |
| `image` | `text` | not null | R2 path |
| `is_cover` | `boolean` | not null, default false | Exactly one per architecture |
| `caption` | `text` | | Single caption for all photos |
| `width` | `integer` | not null | For aspect ratio in pin board |
| `height` | `integer` | not null | For aspect ratio in pin board |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | auto-updated via trigger | |

### `architecture_notes`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `architecture_id` | `uuid` | FK → architectures, not null, cascade delete | |
| `text` | `text` | not null | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | auto-updated via trigger | |

### `architecture_links`

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `architecture_id` | `uuid` | FK → architectures, not null, cascade delete | |
| `type` | `text` | not null | `wikipedia`, `archdaily`, `structurae`, `custom` |
| `url` | `text` | not null | |
| `label` | `text` | not null | Display label |
| `sort_order` | `integer` | not null, default 0 | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | auto-updated via trigger | |

## Deferred

- `suggestions` table — user-submitted buildings pending admin review
- Tags/styles categorization
- Full-text search (`search_vector`) — can be added later if needed

## Mapping to Current TypeScript Types

The current `Arch` type in `src/lib/data/architectures.ts` maps to this schema:

- `architect` → join through `architect_id` → `architects.name`
- `coordinates` → derived from PostGIS `coordinates` (lng/lat)
- `pages` → removed; `pages[0]?.image` usage replaced by cover photo query (`is_cover = true`)
- `photos` → `architecture_photos` rows where `is_cover = false`
- `cover_image`, cover captions → `architecture_photos` row where `is_cover = true`
- `links.googleMaps` → `architectures.google_maps_url`
- `links.wikipedia`, `links.archdaily` → `architecture_links` rows with matching `type`
- `links.custom` → `architecture_links` rows with `type = 'custom'`
- `notes` → `architecture_notes` rows

The Supabase query layer will map responses back to the existing `Arch` type so components don't change.

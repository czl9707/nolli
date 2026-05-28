# Supabase Data Layer Design

> Date: 2026-05-27
> Status: Draft

## Context

Nolli currently hardcodes architecture data in `src/lib/data/architectures.ts` (2 entries). We need to scale to 10K+ entries with viewport queries, full-text search, and attribute filters. The data is curated offline — users may suggest buildings via a form, but all writes go through admin review.

## Decision

Use Supabase (Postgres + PostGIS) as the sole data backend. The SPA calls Supabase's REST API directly. Images live on R2/CDN.

Future optimization: if map queries become a bottleneck, layer in SQLite WASM as a client-side cache. Not needed now.

## Architecture

```
GitHub Pages (SPA)
  ──►  Supabase REST API   (metadata: bbox queries, search, filters, suggestions)
  ──►  R2 / CDN            (images: cover, photos — loaded on demand)
```

No custom backend. No Express server. The SPA is fully static.

## Database Schema

### `architectures`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | Default `gen_random_uuid()` |
| `slug` | `text` (unique, not null) | URL identifier, e.g. `seagram-building` |
| `name` | `text` (not null) | Building name |
| `architect` | `text` (not null) | Architect or firm name |
| `year` | `text` (not null) | Year or range as text, e.g. `1958`, `1929-1931` |
| `address` | `text` (not null) | Full address |
| `city` | `text` (not null) | City name, derived from address or entered manually. Index for filtering. |
| `country` | `text` (not null) | Country code or name. Index for filtering. |
| `coordinates` | `geography(POINT, 4326)` (not null) | PostGIS point for spatial queries |
| `cover_image` | `text` | R2 path to cover image (used in map drawer) |
| `cover_caption_title` | `text` | Cover image caption title |
| `cover_caption_text` | `text` | Cover image caption body |
| `google_maps_url` | `text` (not null) | Google Maps link |
| `wikipedia_url` | `text` | Optional Wikipedia link |
| `archdaily_url` | `text` | Optional ArchDaily link |
| `search_vector` | `tsvector` | Full-text search index on name + architect + city + address |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Auto-updated |

Indexes:
- `unique` on `slug`
- `GiST` on `coordinates` (PostGIS spatial index for bbox queries)
- `GiST` on `search_vector` (full-text search)
- `btree` on `architect` (filter)
- `btree` on `city` (filter)
- `btree` on `country` (filter)

### `architecture_photos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `architecture_id` | `uuid` (FK → architectures.id, not null) | |
| `image` | `text` (not null) | R2 path |
| `caption` | `text` | Optional caption |
| `width` | `integer` (not null) | For aspect ratio in pin board |
| `height` | `integer` (not null) | For aspect ratio in pin board |
| `sort_order` | `integer` (not null) | Display order, default 0 |

Cascade delete with architecture.

### `architecture_pages`

Rich-content pages used in the map drawer (cover + additional info cards).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `architecture_id` | `uuid` (FK → architectures.id, not null) | |
| `image` | `text` (not null) | R2 path |
| `caption_title` | `text` | Optional |
| `caption_text` | `text` | Optional |
| `sort_order` | `integer` (not null) | Display order, default 0 |

Cascade delete with architecture.

### `architecture_notes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `architecture_id` | `uuid` (FK → architectures.id, not null) | |
| `text` | `text` (not null) | |
| `sort_order` | `integer` (not null) | Display order, default 0 |

Cascade delete with architecture.

### `architecture_custom_links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `architecture_id` | `uuid` (FK → architectures.id, not null) | |
| `url` | `text` (not null) | |
| `label` | `text` (not null) | |
| `sort_order` | `integer` (not null) | Display order, default 0 |

Cascade delete with architecture.

### `suggestions`

User-submitted building suggestions, pending admin review.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` (PK) | |
| `name` | `text` (not null) | Building name |
| `architect` | `text` | Optional |
| `address` | `text` | Optional |
| `city` | `text` | Optional |
| `country` | `text` | Optional |
| `latitude` | `float8` | Optional |
| `longitude` | `float8` | Optional |
| `notes` | `text` | User's description or reasoning |
| `submitter_email` | `text` | Optional, for follow-up |
| `status` | `text` (not null) | `pending` / `approved` / `rejected`, default `pending` |
| `created_at` | `timestamptz` | Default `now()` |
| `reviewed_at` | `timestamptz` | Set when status changes from pending |

## Query Patterns

### Map viewport (bbox query)

```sql
SELECT id, slug, name, architect, year, coordinates, cover_image
FROM architectures
WHERE coordinates && ST_MakeEnvelope(:sw_lng, :sw_lat, :ne_lng, :ne_lat, 4326);
```

PostGIS GiST index makes this fast. Only fetches lightweight fields needed for map pins + drawer cover.

### Full-text search

```sql
SELECT id, slug, name, architect, year, city
FROM architectures
WHERE search_vector @@ plainto_tsquery('english', :query);
```

### Filtered search

```sql
SELECT id, slug, name, architect, year, city
FROM architectures
WHERE architect = :architect
  AND city = :city
  AND coordinates && ST_MakeEnvelope(:sw_lng, :sw_lat, :ne_lng, :ne_lat, 4326);
```

### Architecture detail (pin board)

```sql
-- Single query using Supabase's embedded resource syntax
GET /rest/v1/architectures?slug=eq.seagram-building&select=*,photos:architecture_photos(*),pages:architecture_pages(*),notes:architecture_notes(*),custom_links:architecture_custom_links(*)
```

Supabase's PostgREST handles the joins automatically via foreign key relationships.

### Suggest a building

```sql
INSERT INTO suggestions (name, architect, address, city, country, latitude, longitude, notes, submitter_email)
VALUES (:name, :architect, :address, :city, :country, :lat, :lng, :notes, :email);
```

Admin reviews via Supabase dashboard. Approved suggestions get manually entered into `architectures` (or via a script).

## Client Integration

### Supabase client setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

### Replacing current data layer

The existing `src/lib/data/architectures.ts` exports `getArchBySlug()` and `getAllArchitectures()`. These get replaced with Supabase queries:

- `getAllArchitectures()` → bbox query or `select=id,slug,name,coordinates` for initial map load
- `getArchBySlug(slug)` → detail query with embedded photos/pages/notes/links

The `Arch` type stays the same — Supabase responses get mapped to it. Components don't change.

### Image loading

Images stay on R2. The `image` fields in the DB store R2 paths (e.g., `/images/seagram-1.jpg`). The SPA constructs full URLs using a base URL:

```typescript
const imageUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}${image}`
```

## Dev/Deploy Workflow

### Local dev

1. `npm run dev` — Vite serves SPA, connects to Supabase (local or cloud)
2. Data managed via Supabase dashboard, SQL editor, or migration scripts
3. Images uploaded to R2 dev bucket

### Data entry

1. Add building via Supabase dashboard (table editor or SQL)
2. Upload images to R2
3. Immediately reflected in the app — no build/deploy needed for data changes

### Deploy

1. Push code → GitHub → GitHub Actions → build SPA → deploy to GitHub Pages
2. Data changes are instant (Supabase is live). No redeploy needed.
3. Image sync: upload to R2 whenever you have new images.

### Suggestion flow

1. User fills form in SPA → `POST` to Supabase `suggestions` table (via anon key with insert-only RLS policy)
2. Admin reviews in Supabase dashboard
3. Approved: admin creates full architecture entry with photos/pages/notes
4. Rejected: admin sets `status = 'rejected'`

## Row-Level Security

- `architectures`, `architecture_*` tables: public read, admin-only write
- `suggestions`: public insert (anyone can submit), admin-only read/update/delete
- Admin access via Supabase Auth (service role key for scripts, dashboard for manual edits)

## Migration Strategy

1. Create Supabase project, run schema migration
2. Write a one-time seed script that reads current hardcoded data from `architectures.ts` and inserts into Supabase
3. Replace `getArchBySlug()` and `getAllArchitectures()` with Supabase queries
4. Verify map and pin board work identically
5. Remove hardcoded data file

## Cost Estimate

| Resource | Expected cost |
|----------|--------------|
| Supabase free tier | $0 (500MB DB, 50K rows, 500MB storage) |
| Supabase Pro (if needed) | $25/month (8GB DB, unlimited rows) |
| R2 storage (images) | ~$0.015/GB/month |
| R2 bandwidth | Free tier covers most traffic |
| GitHub Pages | Free |

At 10K architectures with metadata only (no images in DB), the DB size would be ~50-100MB. Free tier covers this easily.

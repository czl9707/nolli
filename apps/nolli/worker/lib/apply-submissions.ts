import { type Sql, type Tx } from "@worker/lib/data/db"
import {
  type SubmissionPayload,
  slugify,
  buildGoogleMapsUrl,
} from "@nolli/data"

export class UnknownCountryError extends Error {
  constructor(public country: string) {
    super(`unknown country: ${country}`)
    this.name = "UnknownCountryError"
  }
}

export class DuplicateSlugError extends Error {
  constructor(public slug: string) {
    super(`slug already exists: ${slug}`)
    this.name = "DuplicateSlugError"
  }
}

async function getCountryByName(
  db: Sql | Tx,
  name: string
): Promise<number> {
  const [row] = await db<{ id: number }[]>`
    select id from public.countries where name = ${name} limit 1
  `
  if (!row) throw new UnknownCountryError(name)
  return row.id
}

async function getOrCreateCity(
  db: Sql | Tx,
  name: string,
  countryId: number
): Promise<number> {
  const [row] = await db<{ id: number }[]>`
    insert into public.cities (name, country_id)
    values (${name}, ${countryId})
    on conflict (name, country_id) do update set name = excluded.name
    returning id
  `
  return row.id
}

async function getOrCreateArchitect(
  db: Sql | Tx,
  name: string,
  countryId: number
): Promise<number> {
  const [row] = await db<{ id: number }[]>`
    insert into public.architects (name, country_id)
    values (${name}, ${countryId})
    on conflict (name) do update set name = excluded.name
    returning id
  `
  return row.id
}

export async function applySubmissionPayload(
  db: Sql | Tx,
  payload: SubmissionPayload,
  imageOf: (stagingKey: string) => string
): Promise<number> {
  const m = payload.metadata
  const countryId = await getCountryByName(db, m.country)
  const cityId = await getOrCreateCity(db, m.city, countryId)
  const architectId = await getOrCreateArchitect(db, m.architect, countryId)
  const slug = slugify(m.name)

  const googleMapsUrl =
    m.google_maps_url ?? buildGoogleMapsUrl(m)

  const inserted = await db<{ id: number }[]>`
    insert into public.architectures
      (slug, name, architect_id, year, address, city_id,
       latitude, longitude, google_maps_url)
    values
      (${slug}, ${m.name}, ${architectId}, ${m.year}, ${m.address ?? ""},
       ${cityId}, ${m.latitude}, ${m.longitude}, ${googleMapsUrl})
    on conflict (slug) do nothing
    returning id
  `
  if (inserted.length === 0) throw new DuplicateSlugError(slug)
  const archId = inserted[0].id

  for (const p of payload.photos) {
    await db`
      insert into public.architecture_photos
        (architecture_id, image, is_cover, caption, width, height)
      values
        (${archId}, ${imageOf(p.staging_key)}, ${p.is_cover},
         ${p.caption}, ${p.width}, ${p.height})
    `
  }

  for (const n of payload.notes) {
    await db`
      insert into public.architecture_notes (architecture_id, text)
      values (${archId}, ${n.text})
    `
  }

  for (const l of payload.links) {
    await db`
      insert into public.architecture_links
        (architecture_id, type, url, label, sort_order)
      values
        (${archId}, ${l.type}, ${l.url}, ${l.label ?? l.url}, ${l.sort_order})
    `
  }

  return archId
}

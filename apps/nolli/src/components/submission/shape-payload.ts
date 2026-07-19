import { z } from "zod"
import { buildGoogleMapsUrl, type SubmissionPayload } from "@nolli/data"

const photoDimensions = {
  width: z.number().int(),
  height: z.number().int(),
}

export const existingPhotoSchema = z.object({
  kind: z.literal("existing"),
  staging_key: z.string().min(1),
  caption: z.string(),
  ...photoDimensions,
})

export const newPhotoSchema = z.object({
  kind: z.literal("new"),
  file: z.instanceof(File),
  caption: z.string(),
  ...photoDimensions,
})

export const photoSchema = z.discriminatedUnion("kind", [existingPhotoSchema, newPhotoSchema])

export type ExistingPhoto = z.infer<typeof existingPhotoSchema>
export type NewPhoto = z.infer<typeof newPhotoSchema>
export type PhotoValue = z.infer<typeof photoSchema>

export const formValuesSchema = z.object({
  metadata: z.object({
    name: z.string().min(1),
    architect: z.string().min(1),
    year: z.number().int(),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    google_maps_url: z.string().url().or(z.literal("")),
  }),
  photos: photoSchema.array().min(1),
  notes: z.array(z.object({ text: z.string().min(1) })),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })),
})

export type FormValues = z.infer<typeof formValuesSchema>

export type ResolvedPhoto = Omit<ExistingPhoto, "kind">
export type ResolvedFormValues = Omit<FormValues, "photos"> & { photos: ResolvedPhoto[] }

/**
 * Upload every "new" photo, leaving "existing" ones untouched. Order is
 * preserved so the cover (index 0) stays the cover. `upload` is injected so the
 * resolution logic is testable without touching the network. Throws on the first
 * upload failure — earlier uploads in the batch become staging orphans, but
 * those are far rarer than the add-then-abandon case this deferral eliminates.
 */
export async function resolvePhotos(
  photos: PhotoValue[],
  upload: (file: File) => Promise<{ staging_key: string }>,
): Promise<ResolvedPhoto[]> {
  const resolved: ResolvedPhoto[] = []
  for (const p of photos) {
    if (p.kind === "existing") {
      resolved.push({
        staging_key: p.staging_key,
        width: p.width,
        height: p.height,
        caption: p.caption,
      })
    } else {
      const { staging_key } = await upload(p.file)
      resolved.push({
        staging_key,
        width: p.width,
        height: p.height,
        caption: p.caption,
      })
    }
  }
  return resolved
}

export type LinkType = "wikipedia" | "archdaily" | "custom"

/** Host-based link classification. URL shape is already validated upstream by
 *  the form schema; the try/catch is defensive for direct callers. */
export function classifyLinkType(url: string): LinkType {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return "custom"
  }
  if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) return "wikipedia"
  if (host === "archdaily.com" || host.endsWith(".archdaily.com")) return "archdaily"
  return "custom"
}

/** Label to store when the submitter left Label blank. `custom` returns null so
 *  apply-submissions falls back to the URL (existing behavior). */
export function defaultLinkLabel(type: LinkType): string | null {
  switch (type) {
    case "wikipedia":
      return "Wikipedia"
    case "archdaily":
      return "ArchDaily"
    case "custom":
      return null
  }
}

export function shapePayload(v: ResolvedFormValues): SubmissionPayload {
  const explicit = v.metadata.google_maps_url.trim()
  const google_maps_url =
    explicit.length > 0
      ? explicit
      : buildGoogleMapsUrl({
          name: v.metadata.name,
          city: v.metadata.city,
          country: v.metadata.country,
        })

  return {
    metadata: { ...v.metadata, google_maps_url },
    photos: v.photos.map((p, i) => ({
      id: null,
      staging_key: p.staging_key,
      caption: p.caption ?? null,
      is_cover: i === 0,
      width: p.width,
      height: p.height,
      action: "new",
    })),
    notes: v.notes.map((n) => ({ id: null, text: n.text, action: "new" })),
    links: v.links.map((l, i) => {
      const type = classifyLinkType(l.url)
      const trimmed = l.label.trim()
      return {
        id: null,
        type,
        url: l.url,
        label: trimmed.length > 0 ? trimmed : defaultLinkLabel(type),
        sort_order: i,
        action: "new",
      }
    }),
  }
}

export function payloadToFormValues(p: SubmissionPayload): FormValues {
  return {
    metadata: {
      name: p.metadata.name,
      architect: p.metadata.architect,
      year: p.metadata.year,
      address: p.metadata.address,
      city: p.metadata.city,
      country: p.metadata.country,
      latitude: p.metadata.latitude,
      longitude: p.metadata.longitude,
      google_maps_url: p.metadata.google_maps_url,
    },
    photos: p.photos.map((ph): ExistingPhoto => ({
      kind: "existing",
      staging_key: ph.staging_key,
      width: ph.width,
      height: ph.height,
      caption: ph.caption ?? "",
    })),
    notes: p.notes.map((n) => ({ text: n.text })),
    links: p.links.map((l) => ({ label: l.label ?? "", url: l.url })),
  }
}

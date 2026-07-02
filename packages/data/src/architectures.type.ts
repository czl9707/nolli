import { z } from "zod"

export const coordinatesSchema = z.object({
  lng: z.number(),
  lat: z.number(),
})
export type Coordinates = z.infer<typeof coordinatesSchema>

export const bBoxSchema = z.object({
  west: z.number(),
  south: z.number(),
  east: z.number(),
  north: z.number(),
})
export type BBox = z.infer<typeof bBoxSchema>

export const archPhotoSchema = z.object({
  image: z.string(),
  caption: z.string().optional(),
  width: z.number(),
  height: z.number(),
})
export type ArchPhoto = z.infer<typeof archPhotoSchema>

export const archNoteSchema = z.object({
  text: z.string(),
})
export type ArchNote = z.infer<typeof archNoteSchema>

export const archLinksSchema = z.object({
  googleMaps: z.string(),
  wikipedia: z.string().optional(),
  archdaily: z.string().optional(),
  custom: z.array(z.object({ url: z.string(), label: z.string() })).optional(),
})
export type ArchLinks = z.infer<typeof archLinksSchema>

export const coverSummarySchema = z.object({
  image: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
})
export type CoverSummary = z.infer<typeof coverSummarySchema>

export const archSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  architect: z.string(),
  year: z.number(),
  coordinates: coordinatesSchema,
  cover: coverSummarySchema,
})
export type ArchSummary = z.infer<typeof archSummarySchema>

export const archSchema = archSummarySchema.extend({
  address: z.string(),
  city: z.string(),
  country: z.string(),
  photos: z.array(archPhotoSchema),
  notes: z.array(archNoteSchema),
  links: archLinksSchema,
})
export type Arch = z.infer<typeof archSchema>

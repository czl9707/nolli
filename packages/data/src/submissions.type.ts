import { z } from "zod"

export const submissionActionSchema = z.enum([
  "new",
  "updated",
  "deleted",
  "unchanged",
])
export type SubmissionAction = z.infer<typeof submissionActionSchema>

export const submissionMetadataSchema = z.object({
  name: z.string().min(1),
  architect: z.string().min(1),
  year: z.number().int(),
  address: z.string(),
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  google_maps_url: z.string().url(),
})
export type SubmissionMetadata = z.infer<typeof submissionMetadataSchema>

export const submissionPhotoSchema = z.object({
  id: z.null(),
  staging_key: z.string(),
  caption: z.string().nullable(),
  is_cover: z.boolean(),
  width: z.number().int(),
  height: z.number().int(),
  action: z.literal("new"),
})
export type SubmissionPhoto = z.infer<typeof submissionPhotoSchema>

export const submissionNoteSchema = z.object({
  id: z.null(),
  text: z.string().min(1),
  action: z.literal("new"),
})
export type SubmissionNote = z.infer<typeof submissionNoteSchema>

export const submissionLinkSchema = z.object({
  id: z.null(),
  type: z.enum(["wikipedia", "archdaily", "custom"]),
  url: z.string().url(),
  label: z.string().nullable(),
  sort_order: z.number().int(),
  action: z.literal("new"),
})
export type SubmissionLink = z.infer<typeof submissionLinkSchema>

export const submissionPayloadSchema = z.object({
  metadata: submissionMetadataSchema,
  photos: z.array(submissionPhotoSchema).min(1),
  notes: z.array(submissionNoteSchema),
  links: z.array(submissionLinkSchema),
})
export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>

export const submissionStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
])
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>

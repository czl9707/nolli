import { z } from "zod"
import { archSchema, archSummarySchema } from "@nolli/data/server"

export const landingDataSchema = z.object({
  summaries: z.array(archSummarySchema),
  cluster: z.array(archSummarySchema),
  hero: archSchema,
  boardSet: z.array(archSchema),
  stats: z.object({ architectures: z.number(), architects: z.number() }),
  heroCamera: z.object({
    center: z.tuple([z.number(), z.number()]),
    zoom: z.number(),
  }),
})

export type LandingData = z.infer<typeof landingDataSchema>

export async function loadLandingData(): Promise<LandingData> {
  const res = await fetch("/landing-data.json")
  if (!res.ok) throw new Error(`landing-data fetch -> ${res.status}`)
  return landingDataSchema.parse(await res.json())
}

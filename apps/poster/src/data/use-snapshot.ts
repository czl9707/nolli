import { useEffect, useState } from "react"
import { z } from "zod"
import type { PosterBuilding } from "@/types"

const coverSchema = z.object({
  image: z.string(),
  width: z.number(),
  height: z.number(),
})

const buildingSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  architect: z.string(),
  year: z.number(),
  coordinates: z.object({ lng: z.number(), lat: z.number() }),
  coverImage: z.string().nullable(),
  cover: coverSchema,
})

const snapshotSchema = z.array(buildingSchema)

export type SnapshotState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; buildings: PosterBuilding[] }

export function useSnapshot(): SnapshotState {
  const [state, setState] = useState<SnapshotState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    fetch("/snapshot.json")
      .then((r) => {
        if (!r.ok) throw new Error(`snapshot.json: ${r.status}`)
        return r.json()
      })
      .then((raw) => snapshotSchema.parse(raw))
      .then((buildings) => {
        if (!cancelled) setState({ status: "ready", buildings })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

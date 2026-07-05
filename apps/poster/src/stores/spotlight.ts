// apps/poster/src/stores/spotlight.ts
import { create } from "zustand"
import { parseMapParams } from "@/lib/url-state"
import { DEFAULT_SPOTLIGHT, type SpotlightSettings } from "@/lib/spotlight-types"

/** Initial values hydrate once from the URL, falling back to defaults.
 *  Caption-text overrides are not URL-backed, so they start at their defaults. */
function initial(): SpotlightSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SPOTLIGHT }
  const p = parseMapParams(window.location.search)
  return {
    imageEdge: p.imageEdge,
    imageCorner: p.imageCorner,
    nameSize: p.nameSize,
    architectSize: p.architectSize,
    customName: DEFAULT_SPOTLIGHT.customName,
    customArchitect: DEFAULT_SPOTLIGHT.customArchitect,
  }
}

type SpotlightState = SpotlightSettings & {
  setImageEdge: (v: SpotlightSettings["imageEdge"]) => void
  setImageCorner: (v: SpotlightSettings["imageCorner"]) => void
  setNameSize: (v: number) => void
  setArchitectSize: (v: number) => void
  setCustomName: (v: string) => void
  setCustomArchitect: (v: string) => void
  /** Bulk replace — used by popstate re-hydrate. */
  replace: (s: SpotlightSettings) => void
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  ...initial(),
  setImageEdge: (imageEdge) => set({ imageEdge }),
  setImageCorner: (imageCorner) => set({ imageCorner }),
  setNameSize: (nameSize) => set({ nameSize }),
  setArchitectSize: (architectSize) => set({ architectSize }),
  setCustomName: (customName) => set({ customName }),
  setCustomArchitect: (customArchitect) => set({ customArchitect }),
  replace: (s) => set({ ...s }),
}))

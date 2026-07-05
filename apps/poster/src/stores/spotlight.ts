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
    captionEdge: p.captionEdge,
    captionCorner: p.captionCorner,
    primarySize: p.primarySize,
    secondarySize: p.secondarySize,
    customPrimary: DEFAULT_SPOTLIGHT.customPrimary,
    customSecondary: DEFAULT_SPOTLIGHT.customSecondary,
  }
}

type SpotlightState = SpotlightSettings & {
  setCaptionEdge: (v: SpotlightSettings["captionEdge"]) => void
  setCaptionCorner: (v: SpotlightSettings["captionCorner"]) => void
  setPrimarySize: (v: number) => void
  setSecondarySize: (v: number) => void
  setCustomPrimary: (v: string) => void
  setCustomSecondary: (v: string) => void
  /** Bulk replace — used by popstate re-hydrate. */
  replace: (s: SpotlightSettings) => void
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  ...initial(),
  setCaptionEdge: (captionEdge) => set({ captionEdge }),
  setCaptionCorner: (captionCorner) => set({ captionCorner }),
  setPrimarySize: (primarySize) => set({ primarySize }),
  setSecondarySize: (secondarySize) => set({ secondarySize }),
  setCustomPrimary: (customPrimary) => set({ customPrimary }),
  setCustomSecondary: (customSecondary) => set({ customSecondary }),
  replace: (s) => set({ ...s }),
}))

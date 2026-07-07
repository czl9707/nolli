// apps/poster/src/stores/spotlight.ts
import { create } from "zustand"
import { parseMapParams } from "@/lib/url-state"
import { DEFAULT_CAPTION, type CaptionSettings } from "@/lib/caption-types"

/** Initial values hydrate once from the URL, falling back to defaults.
 *  Caption-text overrides are not URL-backed, so they start at their defaults. */
function initial(): CaptionSettings {
  if (typeof window === "undefined") return { ...DEFAULT_CAPTION }
  const p = parseMapParams(window.location.search)
  return {
    captionEdge: p.captionEdge,
    captionCorner: p.captionCorner,
    primarySize: p.primarySize,
    secondarySize: p.secondarySize,
    customPrimary: DEFAULT_CAPTION.customPrimary,
    customSecondary: DEFAULT_CAPTION.customSecondary,
  }
}

type CaptionState = CaptionSettings & {
  setCaptionEdge: (v: CaptionSettings["captionEdge"]) => void
  setCaptionCorner: (v: CaptionSettings["captionCorner"]) => void
  setPrimarySize: (v: number) => void
  setSecondarySize: (v: number) => void
  setCustomPrimary: (v: string) => void
  setCustomSecondary: (v: string) => void
  /** Bulk replace — used by popstate re-hydrate. */
  replace: (s: CaptionSettings) => void
}

export const useCaptionStore = create<CaptionState>((set) => ({
  ...initial(),
  setCaptionEdge: (captionEdge) => set({ captionEdge }),
  setCaptionCorner: (captionCorner) => set({ captionCorner }),
  setPrimarySize: (primarySize) => set({ primarySize }),
  setSecondarySize: (secondarySize) => set({ secondarySize }),
  setCustomPrimary: (customPrimary) => set({ customPrimary }),
  setCustomSecondary: (customSecondary) => set({ customSecondary }),
  replace: (s) => set({ ...s }),
}))

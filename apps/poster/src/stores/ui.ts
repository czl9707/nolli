import { create } from "zustand"

type UiState = {
  /**
   * Preview mode: a clean, screenshot-ready map frame. Hides the map controls;
   * in overview it also hides the markers, in spotlight the marker stays so the
   * hero photo stays tied to its location. The sidebar stays open (the
   * screenshot targets `.inset`, not it). The screenshot button lives in the
   * header only while preview is on.
   */
  previewMode: boolean
  togglePreview: () => void
}

export const useUiStore = create<UiState>((set) => ({
  previewMode: false,
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode })),
}))

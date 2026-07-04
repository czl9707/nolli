import { create } from "zustand"

type UiState = {
  previewMode: boolean
  togglePreview: () => void
}

export const useUiStore = create<UiState>((set) => ({
  previewMode: false,
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode })),
}))

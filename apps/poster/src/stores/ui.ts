import { create } from "zustand"

type UiState = {
  /** Left sidebar open (selection list visible). Closed by capture mode. */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  /** Capture mode: hides plain markers, controls, and sidebar for a clean frame. */
  captureMode: boolean
  toggleCapture: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  captureMode: false,
  // Entering capture closes the sidebar; exiting restores it.
  toggleCapture: () =>
    set((s) => ({ captureMode: !s.captureMode, sidebarOpen: s.captureMode })),
}))

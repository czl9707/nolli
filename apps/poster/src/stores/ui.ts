import { create } from "zustand"

type UiState = {
  /** Left sidebar open (selection list visible). Closed by capture mode. */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  /** Capture mode: hides plain markers, controls, and sidebar for a clean frame. */
  captureMode: boolean
  setCaptureMode: (on: boolean) => void
  toggleCapture: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  captureMode: false,
  setCaptureMode: (on) => set({ captureMode: on, sidebarOpen: !on }),
  toggleCapture: () =>
    // Entering capture closes the sidebar; exiting restores it. (Matches
    // setCaptureMode's sidebar coupling so both entry paths behave the same.)
    set((s) => ({ captureMode: !s.captureMode, sidebarOpen: s.captureMode })),
}))

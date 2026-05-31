import { create } from "zustand"

export type LayoutMode = "board" | "home"

type LayoutState = {
  mode: LayoutMode
  setMode: (mode: LayoutMode) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  mode: "home",
  setMode: (mode) => {
    document.body.dataset.mode = mode
    set({ mode })
  },
}))

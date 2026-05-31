import { create } from "zustand"

type SidebarState = {
  sidebarOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: true,
  setOpen: (open) => set({ sidebarOpen: open }),
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

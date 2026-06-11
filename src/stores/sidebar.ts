import { create } from "zustand"

type MobileSheetState = "peek" | "expanded" | "full"

type SidebarState = {
  sidebarOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void

  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void

  mobileSheetState: MobileSheetState
  setMobileSheetState: (state: MobileSheetState) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: true,
  setOpen: (open) => set({ sidebarOpen: open }),
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  mobileSheetState: "peek",
  setMobileSheetState: (state) => set({ mobileSheetState: state }),
}))

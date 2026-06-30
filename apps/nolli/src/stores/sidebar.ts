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

  // Operation-panel filters collapsible. Lives in the store so it survives
  // unmount/remount when navigating into an arch and back.
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: true,
  setOpen: (open) => set({ sidebarOpen: open }),
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  mobileSheetState: "peek",
  setMobileSheetState: (state) => set({ mobileSheetState: state }),

  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),
}))

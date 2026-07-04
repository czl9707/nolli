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

  /** Distance (px) from the viewport bottom to the mobile sheet's top edge
   *  (= the sheet's visible height), updated every frame during drag/snap.
   *  The map controls sit just above this value. 0 on desktop. */
  sheetY: number
  setSheetY: (y: number) => void

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

  sheetY: 0,
  setSheetY: (y) => set({ sheetY: y }),

  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),
}))

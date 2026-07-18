import { create } from "zustand"

type MobileSheetState = "peek" | "expanded" | "full"

type SidebarState = {
  sidebarOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void

  /** True while a <SideBar> is mounted somewhere. Drives the header toggle
   *  and the desktop panel's presence, so neither has to pattern-match URLs. */
  mounted: boolean
  mount: () => void
  unmount: () => void

  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void

  mobileSheetState: MobileSheetState
  setMobileSheetState: (state: MobileSheetState) => void

  /** Distance (px) from the viewport bottom to the mobile sheet's top edge
   *  (= the sheet's visible height), updated every frame during drag/snap.
   *  The map controls sit just above this value. 0 on desktop. */
  sheetY: number
  setSheetY: (y: number) => void

  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  sidebarOpen: true,
  setOpen: (open) => {
    let { mobileSheetState } = get();
    if (open && mobileSheetState === "peek") {
      set({ mobileSheetState: "expanded" })
    }
    else if (!open && mobileSheetState !== "peek") {
      set({ mobileSheetState: "peek" })
    }
    set({ sidebarOpen: open })
  },
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  mounted: false,
  mount: () => set({ mounted: true, sidebarOpen: true }),
  unmount: () => set({ mounted: false }),

  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  mobileSheetState: "peek",
  setMobileSheetState: (state) => set({ mobileSheetState: state }),

  sheetY: 0,
  setSheetY: (y) => set({ sheetY: y }),

  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),
}))

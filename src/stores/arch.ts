import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures"

type ArchState = {
  lastSelectedArch: Arch | null
  flyToTrigger: number
  setArch: (arch: Arch | null) => void
}

export const useArchStore = create<ArchState>((set) => ({
  lastSelectedArch: null,
  flyToTrigger: 0,
  setArch: (arch) =>
    set((s) => ({
      lastSelectedArch: arch,
      flyToTrigger: arch ? s.flyToTrigger + 1 : s.flyToTrigger,
    })),
}))

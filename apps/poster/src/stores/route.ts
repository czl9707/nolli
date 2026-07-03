import { create } from "zustand"
import type { Side } from "@/lib/url-state"

export type Route = "overview" | "spotlight"

type RouteState = {
  route: Route
  /** Photo side. Only meaningful in spotlight; defaults to "right". */
  side: Side
  setRoute: (route: Route) => void
  setSide: (side: Side) => void
}

export const useRouteStore = create<RouteState>((set) => ({
  route: "overview",
  side: "right",
  setRoute: (route) => set({ route }),
  setSide: (side) => set({ side }),
}))

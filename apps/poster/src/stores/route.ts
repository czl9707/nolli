import { create } from "zustand"
import type { Side } from "@/lib/url-state"
import { parseMapParams } from "@/lib/url-state"

export type Route = "overview" | "spotlight"

function initialRoute(): Route {
  return typeof window !== "undefined" &&
    window.location.pathname === "/spotlight"
    ? "spotlight"
    : "overview"
}

function initialSide(): Side {
  return (typeof window !== "undefined" && parseMapParams(window.location.search).side) || "top-right"
}

type RouteState = {
  route: Route
  side: Side
  setRoute: (route: Route) => void
  setSide: (side: Side) => void
}

export const useRouteStore = create<RouteState>((set) => ({
  route: initialRoute(),
  side: initialSide(),
  setRoute: (route) => set({ route }),
  setSide: (side) => set({ side }),
}))

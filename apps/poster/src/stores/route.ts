// apps/poster/src/stores/route.ts
import { create } from "zustand"

export type Route = "overview" | "spotlight"

function initialRoute(): Route {
  return typeof window !== "undefined" &&
    window.location.pathname === "/spotlight"
    ? "spotlight"
    : "overview"
}

type RouteState = {
  route: Route
  setRoute: (route: Route) => void
}

export const useRouteStore = create<RouteState>((set) => ({
  route: initialRoute(),
  setRoute: (route) => set({ route }),
}))

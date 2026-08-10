// apps/poster/src/stores/route.ts
import { create } from "zustand"

export type Route = "overview" | "spotlight"

export const OVERVIEW_PATH = "/overview"
export const SPOTLIGHT_PATH = "/spotlight"

const ROUTE_PATHS: Record<Route, string> = {
  overview: OVERVIEW_PATH,
  spotlight: SPOTLIGHT_PATH,
}

export function isRoutePath(pathname: string): boolean {
  return pathname === OVERVIEW_PATH || pathname === SPOTLIGHT_PATH
}

// Unknown paths (incl. "/") fall back to overview.
export function routeFromPath(pathname: string): Route {
  return pathname === SPOTLIGHT_PATH ? "spotlight" : "overview"
}

export function pathFromRoute(route: Route): string {
  return ROUTE_PATHS[route]
}

function initialRoute(): Route {
  return typeof window !== "undefined"
    ? routeFromPath(window.location.pathname)
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

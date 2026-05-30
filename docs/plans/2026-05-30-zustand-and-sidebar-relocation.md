# Zustand Migration & Sidebar Relocation

## Overview

Two related changes:
1. Migrate from homebrew React Context/hook state management to Zustand stores
2. Move the sidebar component out of `MapCore` to the `vite-app` level, with proper animated exit during home→board transitions

## Zustand Stores

Four independent stores under `src/stores/`, one per concern:

### `useLayoutStore` — replaces `useLayout` hook

- Holds `mode: "home" | "board"`
- `setMode(mode)` action writes `document.body.dataset.mode` as side effect
- Populated by `LayoutSync` component inside router (reads `useLocation()`)

### `useSidebarStore` — replaces `SidebarContext`

- Holds `sidebarOpen: boolean` (default: `true`)
- `toggle()` and `setOpen(boolean)` actions
- No other logic

### `useArchStore` — replaces `SelectedArchContext`

- Holds `lastSelectedArch: Arch | null` and `flyToTrigger: number`
- `setArch(arch)` action, increments `flyToTrigger` on change
- Populated by `ArchSync` component inside router (reads slug from `useParams()`, calls `getArchBySlug`)

### `useThemeStore` — replaces `useTheme` hook + `ThemeProvider`

- Holds `theme`, `resolvedTheme`
- Manages localStorage persistence and `document.body.dataset.theme` side effect
- `prefers-color-scheme` media query listener runs in store or `ThemeSync` component

### What stays as React Context

- `MapContext` and `MarkerContext` — MapLibre instance is tied to component lifecycle, not a global singleton

## Sidebar Relocation

### Current behavior

Sidebar renders inside `MapCore` as `{isHome && <Sidebar />}`, a flex sibling of the map. On home→board transition, it unmounts instantly with no exit animation.

### New behavior

Sidebar renders at the `vite-app` level as a sibling of `AppContainer`. It is always mounted. Visibility is gated by two conditions from Zustand stores:

- `useLayoutStore().mode === "home"`
- `useSidebarStore().sidebarOpen === true`

Both conditions use the existing `AnimatePresence` + width collapse animation. When transitioning to board mode, the sidebar slides off-screen left using the same width: 0 animation already used for the open/close toggle.

### Component tree (new)

```
vite-app
├─ Header
├─ ThemeSync (keeps theme store → DOM in sync)
├─ LayoutSync (inside router, URL → layout store)
├─ ArchSync (inside router, slug → arch store)
├─ AppContainer / PinBoard
└─ Sidebar (top-level, outside board system)
```

### Edge cases

- `pointer-events: none` when sidebar is collapsed (width: 0) to prevent intercepting board canvas clicks
- Z-index matches header layer
- `document.body.dataset.mode` is written synchronously in the store action, same timing as current `useLayout` hook

## File Changes

### New files

- `src/stores/layout.ts`
- `src/stores/sidebar.ts`
- `src/stores/arch.ts`
- `src/stores/theme.ts`
- `src/components/layout/layout-sync.tsx`
- `src/components/layout/theme-sync.tsx`

### Modified files

- `src/vite-app.tsx` — remove provider wrappers, add sync components, render Sidebar at top level
- `src/components/sidebar/sidebar.tsx` — use Zustand stores instead of context, always mounted
- `src/components/map/index.tsx` — remove Sidebar import and conditional render
- `src/components/layout/theme-provider.tsx` — gutted to ThemeSync or deleted
- `src/components/pin-board/board.tsx` — use `useLayoutStore` instead of `useLayout()`
- Any other consumers of the old contexts/hooks

### Deleted files

- `src/contexts/sidebar.tsx`
- `src/contexts/selected-arch.tsx`
- `src/hooks/use-layout.ts`
- `src/hooks/use-theme.ts`

### Untouched

- `src/components/ui/map-context.tsx` — stays as React context
- All sidebar sub-components (`arch-summary`, `operation-panel`, `sidebar-card`)

## Sync Components

### LayoutSync

Rendered inside router subtree. Reads `useLocation()`, derives mode from pathname, writes to `useLayoutStore.getState().setMode()`. Runs in a `useEffect` on location change.

### ArchSync

Rendered inside router with slug param. Reads `useParams()`, calls `getArchBySlug(slug)`, writes to `useArchStore.getState().setArch()`. Sets arch to `null` on home route (no slug).

### ThemeSync

Reads `useThemeStore` in a component, syncs `document.body.dataset.theme` via `useEffect`. Media query listener for `prefers-color-scheme` runs on mount.

## Data Flow

- **Sidebar toggle**: header button → `useSidebarStore.toggle()` → sidebar animates
- **Map marker click**: marker → `useArchStore.setArch()` + `useSidebarStore.setOpen(true)`
- **Home→board**: URL change → `LayoutSync` → `useLayoutStore.setMode("board")` → sidebar animates closed, board renders
- **Board→home**: back navigation → `LayoutSync` → `useLayoutStore.setMode("home")` → sidebar animates open

## Notes

- `flyToTrigger` counter pattern stays — simple, works, YAGNI for an event system
- No SSR concerns — this is a Vite SPA
- Zustand stores initialize on import, no hydration timing issues

# Zustand Migration & Sidebar Relocation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all homebrew React Context/hook state with Zustand stores and relocate the sidebar to the `vite-app` level with animated transitions.

**Architecture:** Four independent Zustand stores (`layout`, `sidebar`, `arch`, `theme`) replace the current contexts and hooks. Sync components bridge URL→store updates inside the router subtree. The sidebar moves from inside `MapCore` to `vite-app`, always mounted, animated via existing `AnimatePresence` width collapse.

**Tech Stack:** Zustand, React 19, react-router, framer-motion (all already in project except Zustand)

---

### Task 1: Install Zustand

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install zustand
```

**Step 2: Verify install**

```bash
npm ls zustand
```

Expected: `zustand@<version>` listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand dependency"
```

---

### Task 2: Create `useSidebarStore`

**Files:**
- Create: `src/stores/sidebar.ts`

**Step 1: Create the store**

```ts
import { create } from "zustand"

type SidebarState = {
  sidebarOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: true,
  setOpen: (open) => set({ sidebarOpen: open }),
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

**Step 2: Commit**

```bash
git add src/stores/sidebar.ts
git commit -m "feat: add useSidebarStore"
```

---

### Task 3: Create `useLayoutStore`

**Files:**
- Create: `src/stores/layout.ts`

**Step 1: Create the store**

```ts
import { create } from "zustand"

export type LayoutMode = "board" | "home"

type LayoutState = {
  mode: LayoutMode
  setMode: (mode: LayoutMode) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  mode: "home",
  setMode: (mode) => {
    document.body.dataset.mode = mode
    set({ mode })
  },
}))
```

Note: `setMode` writes `document.body.dataset.mode` synchronously as a side effect, matching the current `useLayout` hook behavior.

**Step 2: Commit**

```bash
git add src/stores/layout.ts
git commit -m "feat: add useLayoutStore"
```

---

### Task 4: Create `useArchStore`

**Files:**
- Create: `src/stores/arch.ts`

**Step 1: Create the store**

```ts
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
```

Note: `flyToTrigger` only increments when arch is non-null, matching current behavior in `src/contexts/selected-arch.tsx:41-43`.

**Step 2: Commit**

```bash
git add src/stores/arch.ts
git commit -m "feat: add useArchStore"
```

---

### Task 5: Create `useThemeStore`

**Files:**
- Create: `src/stores/theme.ts`

**Step 1: Create the store**

```ts
import { create } from "zustand"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

function getSystemPreference(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemPreference() : theme
}

function applyTheme(resolved: ResolvedTheme) {
  document.body.dataset.theme = resolved
}

type ThemeState = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  resolvedTheme: resolveTheme(getStoredTheme()),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme)
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },
}))
```

The media query listener and initial DOM write happen in `ThemeSync` (Task 6).

**Step 2: Commit**

```bash
git add src/stores/theme.ts
git commit -m "feat: add useThemeStore"
```

---

### Task 6: Create sync components (`LayoutSync`, `ArchSync`, `ThemeSync`)

**Files:**
- Create: `src/components/layout/layout-sync.tsx`
- Create: `src/components/layout/arch-sync.tsx`
- Create: `src/components/layout/theme-sync.tsx`

**Step 1: Create `LayoutSync`**

This replaces the URL→mode logic from `useLayout` hook. Reads `useLocation()` inside the router, writes to `useLayoutStore`.

```tsx
import { useEffect } from "react"
import { useLocation } from "react-router"
import { useLayoutStore, type LayoutMode } from "@/stores/layout"

export function LayoutSync() {
  const location = useLocation()
  const setMode = useLayoutStore((s) => s.setMode)

  useEffect(() => {
    const mode: LayoutMode = location.pathname.startsWith("/arch/")
      ? "board"
      : "home"
    setMode(mode)
  }, [location.pathname, setMode])

  return null
}
```

**Step 2: Create `ArchSync`**

This replaces the URL→arch resolution logic from `SelectedArchProvider` (`src/contexts/selected-arch.tsx:29-39`).

```tsx
import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { getArchBySlug } from "@/lib/data/architectures"
import { useArchStore } from "@/stores/arch"

export function ArchSync() {
  const location = useLocation()
  const setArch = useArchStore((s) => s.setArch)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    prevSlugRef.current = match[1]
    getArchBySlug(match[1]).then((arch) => {
      if (arch) setArch(arch)
    })
  }, [location.pathname, setArch])

  return null
}
```

**Step 3: Create `ThemeSync`**

Handles initial DOM write + `prefers-color-scheme` media query listener. Replaces `useTheme` hook (`src/hooks/use-theme.ts:38-53`) and `ThemeHotkey` component (`src/components/layout/theme-provider.tsx:39-57`).

```tsx
import { useEffect } from "react"
import { useThemeStore } from "@/stores/theme"

export function ThemeSync() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    document.body.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        const resolved = mq.matches ? "dark" : "light"
        document.body.dataset.theme = resolved
        useThemeStore.setState({ resolvedTheme: resolved })
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return
      const current = useThemeStore.getState().resolvedTheme
      setTheme(current === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}
```

**Step 4: Commit**

```bash
git add src/components/layout/layout-sync.tsx src/components/layout/arch-sync.tsx src/components/layout/theme-sync.tsx
git commit -m "feat: add LayoutSync, ArchSync, ThemeSync components"
```

---

### Task 7: Wire up `vite-app.tsx` — remove providers, add sync components

**Files:**
- Modify: `src/vite-app.tsx`

**Step 1: Replace the entire file**

Current file is 32 lines. Replace with:

```tsx
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { PinBoard } from "@/components/pin-board"
import { Sidebar } from "@/components/sidebar/sidebar"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <LayoutSync />
      <ArchSync />
    </>
  )
}

function AppContainer({ children }: { children: React.ReactNode }) {
  return <div className={styles.appContainer}>{children}</div>
}

export function ViteApp() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <RouterSync />
      <Header />
      <AppContainer>
        <PinBoard />
      </AppContainer>
      <Sidebar />
      <Footer />
    </BrowserRouter>
  )
}
```

Key changes:
- `ThemeProvider`, `SelectedArchProvider`, `SidebarProvider` removed
- `ThemeSync`, `LayoutSync`, `ArchSync` added
- `Sidebar` rendered as top-level sibling (outside `AppContainer`/`PinBoard`)
- `useLayout()` call removed from `AppContainer`

**Step 2: Commit**

```bash
git add src/vite-app.tsx
git commit -m "refactor: remove context providers, add sync components, relocate sidebar"
```

---

### Task 8: Update `Sidebar` to use Zustand stores

**Files:**
- Modify: `src/components/sidebar/sidebar.tsx`
- Modify: `src/components/sidebar/sidebar.module.css`

**Step 1: Update `sidebar.tsx`**

Replace the entire file. Key changes:
- Import from Zustand stores instead of contexts
- Gate visibility on both `mode === "home"` and `sidebarOpen`
- Add `pointer-events: none` when collapsed

```tsx
import { useSidebarStore } from "@/stores/sidebar"
import { useArchStore } from "@/stores/arch"
import { useLayoutStore } from "@/stores/layout"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_SHORT } from "@/lib/animation"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import styles from "./sidebar.module.css"

export function Sidebar() {
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const setArch = useArchStore((s) => s.setArch)
  const mode = useLayoutStore((s) => s.mode)
  const navigate = useNavigate()

  const isOpen = mode === "home" && sidebarOpen
  const sidebarView = lastSelectedArch ? "arch" : "panel"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sidebar"
          className={styles.sidebarWrapper}
          initial={{ width: 0, paddingRight: 0 }}
          animate={{ width: 360, paddingRight: "var(--spacing-paragraph)" }}
          exit={{ width: 0, paddingRight: 0 }}
          transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className={styles.sidebarContent}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: TRANSITION_SHORT,
                delay: TRANSITION_SHORT,
              },
            }}
            exit={{ opacity: 0, transition: { duration: TRANSITION_SHORT } }}
          >
            <AnimatePresence mode="wait">
              {sidebarView === "arch" && lastSelectedArch ? (
                <ArchSummary
                  key="arch"
                  arch={lastSelectedArch}
                  onView={() => navigate(`/arch/${lastSelectedArch.slug}`)}
                  onClose={() => setArch(null)}
                />
              ) : (
                <OperationPanel key="panel" />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Update `sidebar.module.css`**

Add `pointer-events: none` and positioning for top-level placement:

```css
.sidebarWrapper {
  max-width: 360px;
  overflow: hidden;
  flex-shrink: 0;
  position: absolute;
  top: var(--size-header-height);
  left: var(--spacing-component);
  bottom: var(--size-footer-height);
  z-index: var(--z-header, 100);
}

.sidebarContent {
  width: 360px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-paragraph);
  padding-right: var(--spacing-paragraph);
  overflow-y: auto;
  box-sizing: border-box;
}
```

Note: The sidebar is now absolutely positioned at the `vite-app` level. It positions itself below the header and above the footer using CSS variables. The `z-index` matches the header layer so it sits above the board canvas.

**Step 3: Commit**

```bash
git add src/components/sidebar/sidebar.tsx src/components/sidebar/sidebar.module.css
git commit -m "refactor: sidebar uses Zustand stores, positioned at vite-app level"
```

---

### Task 9: Update `MapCore` — remove sidebar, use stores

**Files:**
- Modify: `src/components/map/index.tsx`

**Step 1: Update imports**

Remove these imports:
```ts
import { useSelectedArch } from "@/contexts/selected-arch"
import { useSidebar } from "@/contexts/sidebar"
import { Sidebar } from "@/components/sidebar/sidebar"
import { useLayout } from "@/hooks/use-layout"
```

Replace with:
```ts
import { useArchStore } from "@/stores/arch"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayoutStore } from "@/stores/layout"
```

**Step 2: Update `IndividualMarker` (line 28-57)**

Replace `useSelectedArch()` and `useSidebar()` with Zustand selectors:

```tsx
function IndividualMarker({
  point,
}: {
  point: Extract<ClusterPoint, { type: "point" }>
}) {
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const setArch = useArchStore((s) => s.setArch)
  const setOpen = useSidebarStore((s) => s.setOpen)

  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Box
          data-selected={lastSelectedArch?.slug === point.slug}
          className={styles.individualMarker}
          onClick={() => {
            if (lastSelectedArch?.slug === point.slug) {
              setArch(null)
            } else {
              getArchBySlug(point.slug).then((arch) => {
                setArch(arch)
                setOpen(true)
              })
            }
          }}
        />
      </MarkerContent>
      <MarkerTooltip>{point.name}</MarkerTooltip>
    </MapMarker>
  )
}
```

**Step 3: Update `MapNavigator` (line 106-138)**

Replace `useSelectedArch()` with Zustand:

```tsx
function MapNavigator() {
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const flyToTrigger = useArchStore((s) => s.flyToTrigger)
  const { map } = useMap()
  const location = useLocation()
  const prevSlugRef = useRef<string | null>(null)
  const prevLocationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!lastSelectedArch || !map) return

    const isSameLocation =
      prevSlugRef.current === lastSelectedArch.slug &&
      prevLocationRef.current === location.pathname

    prevSlugRef.current = lastSelectedArch.slug
    prevLocationRef.current = location.pathname

    setTimeout(
      () =>
        map.flyTo({
          center: [
            lastSelectedArch.coordinates.lng,
            lastSelectedArch.coordinates.lat,
          ],
          zoom: 16,
          duration: TRANSITION_LONG * 1000,
        }),
      isSameLocation ? 0 : TRANSITION_SHORT * 1000
    )
  }, [lastSelectedArch, map, flyToTrigger, location.pathname])

  return null
}
```

**Step 4: Update `MapCore` (line 140-177)**

Remove sidebar rendering, use `useLayoutStore`:

```tsx
export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready, initialize } = useMapPatterns(mapRef)
  const mode = useLayoutStore((s) => s.mode)

  const mapStyles = useMemo(
    () => ({
      light: getMapStyle("light"),
      dark: getMapStyle("dark"),
    }),
    []
  )

  const handleRef = useCallback(
    (map: MapRef | null) => {
      if (!map) return
      mapRef.current = map
      initialize(map)
    },
    [navigate, initialize]
  )

  const isHome = mode === "home"

  return (
    <div className={styles.container}>
      <div className={styles.mapWrapper}>
        <Map ref={handleRef} styles={mapStyles} loading={!ready}>
          {isHome && <MapControls showZoom showLocate showFullscreen />}
          <ArchMarkers />
          <MapNavigator />
        </Map>
      </div>
    </div>
  )
}
```

Key change: `{isHome && <Sidebar />}` removed from the container div. The container is now just the map.

**Step 5: Commit**

```bash
git add src/components/map/index.tsx
git commit -m "refactor: MapCore uses Zustand stores, sidebar removed"
```

---

### Task 10: Update `PinBoard` to use Zustand stores

**Files:**
- Modify: `src/components/pin-board/board.tsx`

**Step 1: Update imports**

Remove:
```ts
import { useLayout } from "@/hooks/use-layout"
import { useSelectedArch } from "@/contexts/selected-arch"
```

Replace with:
```ts
import { useLayoutStore } from "@/stores/layout"
import { useArchStore } from "@/stores/arch"
```

**Step 2: Update `PinBoard` component (line 97-207)**

Change lines 98-100 from:
```ts
const mode = useLayout()
const isBoard = mode === "board"
const { lastSelectedArch } = useSelectedArch()
```

To:
```ts
const mode = useLayoutStore((s) => s.mode)
const isBoard = mode === "board"
const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
```

**Step 3: Commit**

```bash
git add src/components/pin-board/board.tsx
git commit -m "refactor: PinBoard uses Zustand stores"
```

---

### Task 11: Update remaining consumers — `Header`, `ThemeToggle`, `use-map-patterns`

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/theme-toggle.tsx`
- Modify: `src/components/map/use-map-patterns.ts`

**Step 1: Update `header.tsx`**

Replace:
```ts
import { useSidebar } from "@/contexts/sidebar"
```

With:
```ts
import { useSidebarStore } from "@/stores/sidebar"
```

Replace line 10:
```ts
const { sidebarOpen, setSidebarOpen } = useSidebar()
```

With:
```ts
const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
const toggle = useSidebarStore((s) => s.toggle)
```

Replace line 18:
```ts
onClick={() => setSidebarOpen(!sidebarOpen)}
```

With:
```ts
onClick={() => toggle()}
```

**Step 2: Update `theme-toggle.tsx`**

Replace:
```ts
import { useThemeContext } from "@/components/layout/theme-provider"
```

With:
```ts
import { useThemeStore } from "@/stores/theme"
```

Replace line 7:
```ts
const { resolvedTheme, setTheme } = useThemeContext()
```

With:
```ts
const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
const setTheme = useThemeStore((s) => s.setTheme)
```

**Step 3: Update `use-map-patterns.ts`**

Replace:
```ts
import { useThemeContext } from "@/components/layout/theme-provider"
```

With:
```ts
import { useThemeStore } from "@/stores/theme"
```

Replace line 9:
```ts
const { resolvedTheme } = useThemeContext()
```

With:
```ts
const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
```

**Step 4: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/theme-toggle.tsx src/components/map/use-map-patterns.ts
git commit -m "refactor: remaining consumers use Zustand stores"
```

---

### Task 12: Delete old context/hook files and `ThemeProvider`

**Files:**
- Delete: `src/contexts/sidebar.tsx`
- Delete: `src/contexts/selected-arch.tsx`
- Delete: `src/hooks/use-layout.ts`
- Delete: `src/hooks/use-theme.ts`
- Delete: `src/components/layout/theme-provider.tsx`

**Step 1: Verify no remaining imports**

```bash
rg "from \"@/contexts/sidebar\"|from \"@/contexts/selected-arch\"|from \"@/hooks/use-layout\"|from \"@/hooks/use-theme\"|from \"@/components/layout/theme-provider\"" src/
```

Expected: no matches

**Step 2: Delete files**

```bash
rm src/contexts/sidebar.tsx src/contexts/selected-arch.tsx src/hooks/use-layout.ts src/hooks/use-theme.ts src/components/layout/theme-provider.tsx
```

**Step 3: Check if `src/contexts/` directory is now empty**

```bash
ls src/contexts/
```

If empty, remove it: `rmdir src/contexts/`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old context providers and hooks"
```

---

### Task 13: Verify — lint, typecheck, manual test

**Step 1: Run lint**

```bash
npm run lint
```

Expected: no errors

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors

**Step 3: Run dev server and manually test**

```bash
npm run dev
```

Verify:
- Sidebar opens/closes with header toggle button
- Sidebar shows `ArchSummary` when a marker is clicked
- Sidebar animates off-screen left when navigating to `/arch/:slug`
- Sidebar animates back when navigating back to `/`
- Theme toggle (Ctrl+D) works
- Map patterns load and switch with theme
- Pin board renders correctly in board mode

**Step 4: Commit any fixes if needed**

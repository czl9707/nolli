# Mobile-Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Nolli sidebar into a rail + panel system on desktop and a drawer + bottom sheet on mobile.

**Architecture:** The current single sidebar splits into an icon rail (navigation) and a collapsible panel (content). On mobile (<720px), the rail is replaced by a slide-in drawer, and the panel content moves to a draggable bottom sheet. Route-based active states. Zustand for state, Framer Motion for animations, Radix Dialog for the mobile drawer, CSS Modules for styling.

**Tech Stack:** React 19, TypeScript, Framer Motion, Radix UI, Zustand, CSS Modules, PostCSS custom media queries

---

## File Structure

### New files
- `src/hooks/use-is-mobile.ts` — breakpoint detection hook
- `src/components/nav/nav-rail.tsx` — icon rail for desktop
- `src/components/nav/nav-rail.module.css` — rail styles
- `src/components/nav/mobile-drawer.tsx` — mobile navigation drawer
- `src/components/nav/mobile-drawer.module.css` — drawer styles
- `src/components/nav/bottom-sheet.tsx` — mobile bottom sheet for panel content
- `src/components/nav/bottom-sheet.module.css` — sheet styles

### Modified files
- `src/styles/global.css` — add `--size-rail-width`, safe-area variables
- `src/stores/sidebar.ts` — add `mobileDrawerOpen`, `mobileSheetState`
- `src/components/sidebar/sidebar.tsx` — integrate rail, remove footer, conditional mobile rendering
- `src/components/sidebar/sidebar.module.css` — add rail + panel layout, mobile styles
- `src/components/layout/header.tsx` — mobile: toggle triggers drawer
- `src/components/layout/header.module.css` — mobile breakpoint styles
- `src/components/sidebar/nav-user.tsx` — compact variant for rail
- `src/vite-app.tsx` — wire new components
- `index.html` — viewport-fit=cover

### Deleted
- Sidebar footer section in `sidebar.tsx` (the `Footer` component and its imports)

---

### Task 1: Foundations — CSS variables, viewport meta, useIsMobile hook

**Files:**
- Modify: `src/styles/global.css`
- Modify: `index.html`
- Create: `src/hooks/use-is-mobile.ts`

- [ ] **Step 1: Add CSS variables to global.css**

Add after the `--size-sidebar-width: 24rem;` line (around line 111):

```css
    --size-rail-width: 3.5rem;

    --safe-area-top: env(safe-area-inset-top);
    --safe-area-bottom: env(safe-area-inset-bottom);
    --safe-area-left: env(safe-area-inset-left);
    --safe-area-right: env(safe-area-inset-right);
```

- [ ] **Step 2: Update viewport meta in index.html**

Change line 5 from:
```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
to:
```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 3: Create `src/hooks/use-is-mobile.ts`**

```typescript
import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 720

function subscribe(callback: () => void) {
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

- [ ] **Step 4: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css index.html src/hooks/use-is-mobile.ts
git commit -m "feat: add responsive foundations — CSS vars, viewport-fit, useIsMobile hook"
```

---

### Task 2: Extend sidebar store

**Files:**
- Modify: `src/stores/sidebar.ts`

- [ ] **Step 1: Add mobile state to the store**

Replace the entire contents of `src/stores/sidebar.ts` with:

```typescript
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
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: true,
  setOpen: (open) => set({ sidebarOpen: open }),
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  mobileSheetState: "peek",
  setMobileSheetState: (state) => set({ mobileSheetState: state }),
}))
```

- [ ] **Step 2: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/stores/sidebar.ts
git commit -m "feat: extend sidebar store with mobile drawer and sheet state"
```

---

### Task 3: NavRail component

**Files:**
- Create: `src/components/nav/nav-rail.tsx`
- Create: `src/components/nav/nav-rail.module.css`

- [ ] **Step 1: Create `src/components/nav/nav-rail.module.css`**

```css
.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: var(--size-rail-width);
  height: 100%;
  flex-shrink: 0;
  padding: var(--spacing-paragraph) 0;
  box-sizing: border-box;
  border-right: 1px solid rgb(var(--color-primary-foreground) / 0.1);
  z-index: 20;
}

.navItems {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.navItem {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--size-border-radius);
  color: rgb(var(--color-secondary-foreground));
  cursor: pointer;
  transition: background var(--transition-instant) ease,
    color var(--transition-instant) ease;
}

.navItem:hover {
  background: rgb(var(--color-secondary-background));
}

.navItemActive {
  background: rgb(var(--color-secondary-background));
  color: rgb(var(--color-primary-foreground));
}

.spacer {
  flex: 1;
}

.userSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  padding-top: var(--spacing-paragraph);
}
```

- [ ] **Step 2: Create `src/components/nav/nav-rail.tsx`**

```tsx
import { useLocation, useNavigate } from "react-router"
import { Home, Star, Plus, Info } from "lucide-react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import styles from "./nav-rail.module.css"

const navItems = [
  { icon: Home, label: "Map", path: "/" },
  { icon: Star, label: "Favorites", path: "/favorites" },
  { icon: Plus, label: "Submit", path: "/submit" },
  { icon: Info, label: "About", path: "/about" },
] as const

export function NavRail() {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/arch")
    return location.pathname.startsWith(path)
  }

  return (
    <div className={styles.rail}>
      <div className={styles.navItems}>
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                >
                  <item.icon size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      <div className={styles.spacer} />
      <div className={styles.userSection}>
        <NavUser variant="compact" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: Will show errors — `NavUser` doesn't accept `variant` prop yet, and `Tooltip` components need to be checked. We'll fix NavUser in Task 9. For now, temporarily remove `variant="compact"` and use `<NavUser />`.

- [ ] **Step 4: Commit**

```bash
mkdir -p src/components/nav
git add src/components/nav/nav-rail.tsx src/components/nav/nav-rail.module.css
git commit -m "feat: create NavRail component — icon navigation for desktop"
```

---

### Task 4: Restructure Sidebar — integrate rail, remove footer

**Files:**
- Modify: `src/components/sidebar/sidebar.tsx`
- Modify: `src/components/sidebar/sidebar.module.css`

This is the core task. The sidebar becomes a container that holds NavRail + Panel on desktop, and renders nothing on mobile (content moves to BottomSheet).

- [ ] **Step 1: Update `src/components/sidebar/sidebar.module.css`**

Replace entire file with:

```css
.sidebarOuter {
  display: flex;
  flex-shrink: 0;
  z-index: 20;
  overflow: hidden;
}

.railSlot {
  flex-shrink: 0;
}

.panelWrapper {
  width: var(--size-sidebar-width);
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.panelContent {
  min-height: 0;
  flex: 1 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  gap: var(--spacing-paragraph);
}

.footer {
  display: flex;
  height: fit-content;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: var(--spacing-paragraph);
  border-top: 1px solid rgb(var(--color-primary-foreground) / 0.1);
}

.footerLink {
  width: 100%;
  justify-content: flex-start;
}
```

- [ ] **Step 2: Update `src/components/sidebar/sidebar.tsx`**

Replace entire file with:

```tsx
import { useState } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT, TRANSITION_SHORT } from "@/lib/constants"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import { NavRail } from "@/components/nav/nav-rail"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./sidebar.module.css"

const contentVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -40 : 40,
    opacity: 0,
  }),
}

export function Sidebar() {
  const isMobile = useIsMobile()
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  // On mobile, sidebar renders nothing — content is in BottomSheet
  if (isMobile) return null

  const isOpen = mode === "home" && sidebarOpen
  const sidebarView = selectedArch ? "arch" : "panel"

  const [[view, direction], setView] = useState<
    [string, "forward" | "backward"]
  >([sidebarView, "forward"])

  if (view !== sidebarView) {
    setView([
      sidebarView,
      sidebarView === "arch" ? "forward" : "backward",
    ])
  }

  const transition = {
    duration: TRANSITION_INSTANT,
    ease: "easeInOut" as const,
  }

  return (
    <div className={styles.sidebarOuter}>
      <div className={styles.railSlot}>
        <NavRail />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            animate={{ width: "var(--size-sidebar-width)" }}
            exit={{ width: 0 }}
            transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={styles.panelWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={view}
                  className={styles.panelContent}
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transition}
                >
                  {sidebarView === "arch" ? (
                    <ArchSummary />
                  ) : (
                    <OperationPanel />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Key changes from the original:
- Footer component removed entirely (about, github, nav-user are gone from sidebar)
- `NavRail` rendered in a fixed slot next to the panel
- Returns `null` on mobile
- The outer wrapper is always rendered (holds the rail), only the panel animates open/close
- Removed `padding-right: var(--spacing-component)` from panel wrapper (spacing moves to app container)

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors (NavUser compact variant will error — we'll fix in Task 9. Temporarily use `<NavUser />` without the prop if needed)

- [ ] **Step 4: Run dev server and visually verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npm run dev`

Expected:
- Desktop: Rail icons visible on left, panel opens/closes with header toggle
- Panel content (filters, arch list) works as before
- NavRail tooltips show on hover
- Active icon highlighted based on current route

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/sidebar.tsx src/components/sidebar/sidebar.module.css
git commit -m "feat: restructure sidebar into rail + panel layout, remove footer"
```

---

### Task 5: MobileDrawer component

**Files:**
- Create: `src/components/nav/mobile-drawer.tsx`
- Create: `src/components/nav/mobile-drawer.module.css`

A slide-in overlay drawer for mobile navigation, built on Radix Dialog.

- [ ] **Step 1: Create `src/components/nav/mobile-drawer.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  z-index: 100;
}

.content {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 18rem;
  background: rgb(var(--color-primary-background));
  z-index: 101;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-paragraph);
  box-sizing: border-box;
  overflow-y: auto;
}

.navList {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  height: 2.75rem;
  padding: 0 0.75rem;
  border-radius: var(--size-border-radius);
  font-family: var(--font-playful);
  font-size: 0.875rem;
  color: rgb(var(--color-secondary-foreground));
  cursor: pointer;
  transition: background var(--transition-instant) ease,
    color var(--transition-instant) ease;
  border: none;
  background: none;
}

.navItem:hover {
  background: rgb(var(--color-secondary-background));
}

.navItemActive {
  background: rgb(var(--color-secondary-background));
  color: rgb(var(--color-primary-foreground));
}

.spacer {
  flex: 1;
}

.divider {
  height: 1px;
  background: rgb(var(--color-primary-foreground) / 0.1);
  margin: var(--spacing-paragraph) 0;
}
```

- [ ] **Step 2: Create `src/components/nav/mobile-drawer.tsx`**

```tsx
import { useLocation, useNavigate } from "react-router"
import { Home, Star, Plus, Info } from "lucide-react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog"
import { useSidebarStore } from "@/stores/sidebar"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_SHORT } from "@/lib/constants"
import styles from "./mobile-drawer.module.css"

const navItems = [
  { icon: Home, label: "Map", path: "/" },
  { icon: Star, label: "Favorites", path: "/favorites" },
  { icon: Plus, label: "Submit", path: "/submit" },
  { icon: Info, label: "About", path: "/about" },
] as const

export function MobileDrawer() {
  const location = useLocation()
  const navigate = useNavigate()
  const open = useSidebarStore((s) => s.mobileDrawerOpen)
  const setOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/arch")
    return location.pathname.startsWith(path)
  }

  function handleNav(path: string) {
    navigate(path)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <DialogOverlay className={styles.overlay} />
            </motion.div>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <DialogContent
                className={styles.content}
                showCloseButton={false}
                aria-label="Navigation"
              >
                <nav className={styles.navList}>
                  {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.label}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                        onClick={() => handleNav(item.path)}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
                <div className={styles.spacer} />
                <div className={styles.divider} />
                <NavUser variant="compact" />
              </DialogContent>
            </motion.div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
```

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: May have errors for `NavUser variant="compact"` — will fix in Task 9. Temporarily remove the prop if needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/nav/mobile-drawer.tsx src/components/nav/mobile-drawer.module.css
git commit -m "feat: create MobileDrawer — slide-in navigation overlay for mobile"
```

---

### Task 6: BottomSheet component

**Files:**
- Create: `src/components/nav/bottom-sheet.tsx`
- Create: `src/components/nav/bottom-sheet.module.css`

A draggable bottom sheet that holds the panel content on mobile. Uses Framer Motion drag.

- [ ] **Step 1: Create `src/components/nav/bottom-sheet.module.css`**

```css
.sheetWrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  background: rgb(var(--color-primary-background));
  border-top: 1px solid rgb(var(--color-primary-foreground) / 0.1);
  border-radius: var(--size-border-radius) var(--size-border-radius) 0 0;
  box-shadow: 0 -2px 10px rgb(var(--color-primary-foreground) / 0.1);
  touch-action: none;
}

.handleBar {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 0.25rem;
  cursor: grab;
}

.handleIndicator {
  width: 2rem;
  height: 0.25rem;
  border-radius: 0.125rem;
  background: rgb(var(--color-primary-foreground) / 0.3);
}

.peekContent {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 1rem 0.75rem;
  font-family: var(--font-playful);
  font-size: 0.875rem;
  color: rgb(var(--color-secondary-foreground));
}

.sheetContent {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--spacing-paragraph) var(--spacing-paragraph);
}
```

- [ ] **Step 2: Create `src/components/nav/bottom-sheet.tsx`**

```tsx
import { useRef, useState } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { OperationPanel } from "@/components/sidebar/operation-panel"
import { ArchSummary } from "@/components/sidebar/arch-summary"
import styles from "./bottom-sheet.module.css"

type SheetSnap = "peek" | "expanded" | "full"

const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  peek: "4rem",
  expanded: "50vh",
  full: "90vh",
}

function getNearestSnap(y: number, sheetHeight: number): SheetSnap {
  const vh = window.innerHeight
  const ratios = {
    peek: 4 * 16 / vh,
    expanded: 0.5,
    full: 0.9,
  }
  const currentRatio = y / vh
  const clamped = Math.max(ratios.peek, Math.min(ratios.full, currentRatio))

  let nearest: SheetSnap = "expanded"
  let minDist = Infinity
  for (const [snap, ratio] of Object.entries(ratios)) {
    const dist = Math.abs(clamped - ratio)
    if (dist < minDist) {
      minDist = dist
      nearest = snap as SheetSnap
    }
  }
  return nearest
}

export function BottomSheet() {
  const isMobile = useIsMobile()
  const sheetState = useSidebarStore((s) => s.mobileSheetState)
  const setSheetState = useSidebarStore((s) => s.setMobileSheetState)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  // Don't render on desktop or on board view
  if (!isMobile || mode === "board") return null

  const content = selectedArch ? <ArchSummary /> : <OperationPanel />
  const height = SNAP_HEIGHTS[sheetState]

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const sheetEl = document.querySelector(`.${styles.sheetWrapper}`) as HTMLElement
    if (!sheetEl) return
    const currentY = sheetEl.getBoundingClientRect().top
    const snap = getNearestSnap(currentY, window.innerHeight)
    setSheetState(snap)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sheetState}
        className={styles.sheetWrapper}
        initial={{ height: height }}
        animate={{ height: height }}
        exit={{ height: height }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ height }}
      >
        <div className={styles.handleBar}>
          <div className={styles.handleIndicator} />
        </div>
        {sheetState === "peek" ? (
          <button
            className={styles.peekContent}
            onClick={() => setSheetState("expanded")}
          >
            {selectedArch ? "View details" : "Browse architectures"}
          </button>
        ) : (
          <div className={styles.sheetContent}>
            {content}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/nav/bottom-sheet.tsx src/components/nav/bottom-sheet.module.css
git commit -m "feat: create BottomSheet — draggable panel for mobile"
```

---

### Task 7: Update Header for mobile

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/header.module.css`

On mobile, the header toggle opens the mobile drawer instead of toggling the sidebar.

- [ ] **Step 1: Update `src/components/layout/header.module.css`**

Add mobile styles at the end of the file:

```css
@media (--smaller-than-sm) {
  .header {
    padding-left: calc(var(--safe-area-left) + var(--spacing-paragraph));
    padding-right: calc(var(--safe-area-right) + var(--spacing-paragraph));
    padding-top: var(--safe-area-top);
  }
}
```

- [ ] **Step 2: Update `src/components/layout/header.tsx`**

Replace entire file with:

```tsx
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useSidebarStore } from "@/stores/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useNavigate } from "react-router"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./header.module.css"

export function Header() {
  const navigation = useNavigate()
  const isMobile = useIsMobile()
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const toggle = useSidebarStore((s) => s.toggle)
  const setMobileDrawerOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  function handleToggle() {
    if (isMobile) {
      setMobileDrawerOpen(true)
    } else {
      toggle()
    }
  }

  const isOpen = isMobile ? false : sidebarOpen

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          aria-label={isMobile ? "Open navigation" : isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </Button>
      </div>
      <div className={styles.title} onClick={() => navigation("/")}>
        <img src="/favicon.svg" alt="Nolli Icon" className={styles.icon} />
        Nolli
      </div>
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/header.module.css
git commit -m "feat: header mobile toggle opens drawer, safe-area padding"
```

---

### Task 8: Wire everything in vite-app.tsx

**Files:**
- Modify: `src/vite-app.tsx`
- Modify: `src/vite-app.module.css`

- [ ] **Step 1: Update `src/vite-app.module.css`**

Add mobile padding adjustments:

```css
.appContainer {
    flex: 1;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
}

@media (--larger-than-sm) {
    .appContainer {
        padding-left: var(--spacing-component);
        padding-right: var(--spacing-component);
    }
}
```

The desktop padding stays the same. On mobile (<720px), no side padding — the map goes full-bleed.

- [ ] **Step 2: Update `src/vite-app.tsx`**

Replace entire file with:

```tsx
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { PinBoard } from "@/components/pin-board"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MobileDrawer } from "@/components/nav/mobile-drawer"
import { BottomSheet } from "@/components/nav/bottom-sheet"
import { Toaster } from "@/components/ui/sonner"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <LayoutSync />
      <ArchSync />
    </>
  )
}

export function ViteApp() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <ThemeSync />
      <AuthSync />
      <RouterSync />
      <Header />
      <div className={styles.appContainer}>
        <Sidebar />
        <PinBoard />
      </div>
      <MobileDrawer />
      <BottomSheet />
      <Footer />
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Run dev server and test**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npm run dev`

**Desktop (≥720px) — verify:**
- Rail icons visible on left side of sidebar
- Panel opens/closes with header toggle
- Rail tooltips show on hover
- Active icon matches current route
- Panel content (filters, arch list) works as before
- No sidebar footer (about, github, user)

**Mobile (<720px) — use browser DevTools to resize:**
- Rail is hidden
- Header toggle opens the mobile drawer (slides from left)
- Bottom sheet shows peek bar at bottom on map view
- Tapping peek bar expands the sheet
- Dragging sheet collapses it back to peek
- Drawer closes on backdrop tap
- Drawer navigation links work

- [ ] **Step 4: Commit**

```bash
git add src/vite-app.tsx src/vite-app.module.css
git commit -m "feat: wire NavRail, MobileDrawer, BottomSheet into app layout"
```

---

### Task 9: Update NavUser for compact variant

**Files:**
- Modify: `src/components/sidebar/nav-user.tsx`
- Modify: `src/components/sidebar/nav-user.module.css`

Add a `variant="compact"` prop to NavUser that renders as an avatar-only button for the rail and mobile drawer.

- [ ] **Step 1: Add compact styles to `src/components/sidebar/nav-user.module.css`**

Append to the existing file:

```css
.compactTrigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--size-border-radius);
  background: none;
  border: none;
  cursor: pointer;
  color: rgb(var(--color-secondary-foreground));
  transition: background var(--transition-instant) ease;
}

.compactTrigger:hover {
  background: rgb(var(--color-secondary-background));
}
```

- [ ] **Step 2: Update `src/components/sidebar/nav-user.tsx`**

Add a `variant` prop. When `"compact"`, render as avatar-only (no name/email).

Change the component signature:
```tsx
export function NavUser({ variant = "default" }: { variant?: "default" | "compact" }) {
```

Add a `CompactNavUser` component inside the file (or as a sub-component) that renders just the avatar with a dropdown menu. The compact variant wraps the avatar in the same dropdown/login dialog as the full variant.

Full replacement for the exports and the main component — add the compact rendering logic:

```tsx
export function NavUser({ variant = "default" }: { variant?: "default" | "compact" }) {
  const user = useAuthStore((s) => s.user)

  if (variant === "compact") {
    return user ? <CompactUserNav /> : <CompactGuestNav />
  }

  return user ? <UserNav /> : <GuestNav />
}

function CompactGuestNav() {
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)

  if (!AUTH_ENABLED) {
    return (
      <button className={styles.compactTrigger} disabled>
        <Avatar size="sm">
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
      </button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={styles.compactTrigger}>
          <Avatar size="sm">
            <AvatarFallback>G</AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Log into Nolli</DialogTitle>
        </DialogHeader>
        <Button
          variant="default"
          className={styles.signInButton}
          onClick={signIn}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} /> : <GoogleIcon size={16} />}
          Sign in with Google
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function CompactUserNav() {
  const user = useAuthStore((s) => s.user!)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={styles.compactTrigger}>
          <Avatar size="sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" sideOffset={4}>
        <DropdownMenuLabel>
          <div className={styles.dropdownUser}>
            <Avatar size="sm">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={styles.userInfo}>
              <Body2>{user.name}</Body2>
              <Caption>{user.email}</Caption>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Note: The compact variant removes the Contribution/Favorites dropdown items since those are now in the rail/drawer navigation directly.

- [ ] **Step 3: Verify**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar/nav-user.tsx src/components/sidebar/nav-user.module.css
git commit -m "feat: add compact variant to NavUser for rail and drawer"
```

---

### Task 10: Final integration test and cleanup

**Files:**
- All files from previous tasks

- [ ] **Step 1: Run full type check**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 2: Run build**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npm run build`
Expected: Build succeeds without errors

- [ ] **Step 3: Manual smoke test**

Run: `cd /home/zain_chen/kiyo-n-zane/nolli && npm run dev`

Verify all scenarios:

**Desktop (≥720px):**
- [ ] NavRail visible with 4 icons + user avatar at bottom
- [ ] Active icon highlighted on `/` route
- [ ] Hovering rail icons shows tooltip
- [ ] Clicking Map icon navigates to `/`
- [ ] Panel opens/closes with header toggle
- [ ] Panel shows filters + arch list when no arch selected
- [ ] Panel shows arch detail when arch selected
- [ ] Panel animation smooth (Framer Motion)
- [ ] User avatar opens dropdown (signed in) or login dialog (guest)
- [ ] No sidebar footer (about, github removed)

**Mobile (<720px) — resize browser to <720px:**
- [ ] NavRail hidden
- [ ] Header toggle opens mobile drawer
- [ ] Drawer slides from left with backdrop
- [ ] Drawer shows nav items + user section
- [ ] Clicking nav item closes drawer and navigates
- [ ] Backdrop tap closes drawer
- [ ] Bottom sheet peek bar visible on map view
- [ ] Tapping peek bar expands sheet
- [ ] Dragging sheet up/down snaps to peek/expanded/full
- [ ] Sheet shows filters + arch list
- [ ] Map remains interactive behind sheet
- [ ] No horizontal overflow

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish mobile responsive layout integration"
```

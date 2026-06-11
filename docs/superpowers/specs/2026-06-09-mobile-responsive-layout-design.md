# Mobile-Responsive Layout & Navigation

Design for restructuring the Nolli sidebar into a rail + panel system on desktop and a drawer + bottom sheet on mobile. Addresses [issue #25](https://github.com/czl9707/nolli/issues/25), focusing on slices 1, 2, 3, and 8.

## Overview

Current layout: single collapsible sidebar (24rem) + full-width PinBoard, no mobile support.

Target layout:
- **Desktop (≥720px):** Icon rail + collapsible panel + PinBoard
- **Mobile (<720px):** Full-screen map, navigation drawer, bottom sheet for panel content

Component reference: shadcn sidebar block pattern (nested sidebars with `collapsible="icon"` and `collapsible="none"`).

## Layout Architecture

### Desktop (≥720px)

```
┌───────────── Header (full-width) ────────────┐
├────┬──────────┬───────────────────────────────┤
│ R  │  Panel   │                               │
│ A  │ (24rem)  │      PinBoard (flex: 1)       │
│ I  │          │                               │
│ L  │ filters  │     Map or Board view         │
│    │ archlist │                               │
│    │ or detail│                               │
│    │          │                               │
│    │          │                               │
│    │          │                               │
│ 🏠 │          │                               │
│ ⭐ │          │                               │
│ ➕ │          │                               │
│ ℹ️  │          │                               │
│ 👤 │          │                               │
└────┴──────────┴───────────────────────────────┘
```

- Rail and panel grouped in a single flex container (replaces current sidebar)
- Rail is `--size-rail-width` (3.5rem), always visible
- Panel is `--size-sidebar-width` (24rem), collapsible via header toggle
- PinBoard fills remaining space (flex: 1)
- Header unchanged on desktop

### Mobile (<720px)

```
┌───── Header (toggle, logo, theme) ────┐
├────────────────────────────────────────┤
│                                        │
│          PinBoard (full-width)         │
│                                        │
│                                        │
├────────────────────────────────────────┤
│ ═══ Bottom Sheet (peek bar) ═══        │
│   Filters / Arch List (swipe up)       │
└────────────────────────────────────────┘
```

- Rail hidden entirely
- Header toggle opens mobile drawer (navigation)
- Bottom sheet holds panel content (filters, arch list, arch detail)
- Map remains interactive behind the sheet

## Component Details

### Rail (nav-rail)

Thin vertical bar fixed to the left edge. Contains icon-only navigation.

**Icons (top to bottom):**
1. Map (home) — navigates to `/`
2. Favorites (star) — navigates to `/favorites` (stub)
3. Submit (plus) — navigates to `/submit` (stub)
4. About (info) — navigates to `/about` (stub)

**Bottom:**
5. User avatar — opens user menu (sign in / log out)

**Behavior:**
- Active icon highlighted (background tint or left-border accent)
- Hover shows tooltip with label (Radix Tooltip)
- Only one icon active at a time, determined by current route
- Map and About are route-based; Favorites and Submit are route-based
- Hidden on mobile (<720px)

### Panel

Thick panel (24rem) right of the rail. Same content area as the current sidebar.

**Content by route:**
| Route | Panel shows |
|---|---|
| `/` | Filters (architect, location) + arch list |
| `/arch/:slug` | Arch detail |
| `/favorites` | Favorites list (stub) |
| `/submit` | Submission form (stub) |

**Behavior:**
- Collapsible via header toggle button (existing `PanelLeftClose`/`PanelLeftOpen`)
- When collapsed, only rail remains visible
- Open/close state in `sidebarStore`
- Internal scroll — no body scroll leakage
- On board view, arch detail takes over panel regardless

### Mobile Drawer (mobile-drawer)

Full-screen sheet overlay for navigation on mobile.

**Trigger:** Header toggle button (same `PanelLeftClose`/`PanelLeftOpen` icon)

**Content:**
- Navigation links: Map, Favorites, Submit, About (same icons as rail)
- User section at bottom (avatar, name, sign in/out)

**Behavior:**
- Built with Radix Sheet (Dialog-based), slides from left
- Semi-transparent backdrop, tap to close
- Body scroll locked when open
- Clicking a nav item navigates then closes drawer
- Active route highlighted
- Framer Motion for slide animation

### Mobile Bottom Sheet (bottom-sheet)

Draggable sheet at the bottom of the viewport holding panel content.

**Snap states:**
- **Peek:** thin handle bar showing arch count + current filter summary. Always visible on map view.
- **Expanded (~50% viewport):** drag up from peek. Shows filters + arch cards.
- **Full (~90% viewport):** drag further or tap peek bar. Full content.

**Behavior:**
- Built with Framer Motion drag gestures
- Only appears on map view (`/`)
- On board view (`/arch/:slug`), bottom sheet is hidden; arch detail shows in navigation drawer
- Body scroll NOT locked — map stays interactive
- Sheet has its own internal scroll for arch list

### Header Changes

**Desktop (≥720px):** No change. Toggle controls panel open/close.

**Mobile (<720px):**
- Same toggle icon triggers mobile drawer instead of panel collapse
- Theme toggle stays in header
- Safe-area insets applied via `env(safe-area-inset-*)`
- All interactive elements minimum 44×44px touch targets

### Sidebar Footer Removal

Current sidebar footer (About button, GitHub link, user dropdown) is removed entirely:
- About → becomes a route accessible from rail icon
- GitHub → moves to About page
- User dropdown → moves to rail footer (user avatar at bottom)

## State Management

Extend existing `sidebarStore` (Zustand):

```typescript
type SidebarState = {
  // Existing
  sidebarOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void

  // New
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void

  mobileSheetState: "peek" | "expanded" | "full"
  setMobileSheetState: (state: SidebarState["mobileSheetState"]) => void
}
```

No `activePanel` state — route determines everything. Rail icon highlight reads from URL (same pattern as existing `LayoutMode` logic).

## Routing

| Route | Main view | Panel content | Rail active |
|---|---|---|---|
| `/` | Map | Filters + arch list | Map |
| `/arch/:slug` | Board | Arch detail | Map |
| `/favorites` | Map | Favorites (stub) | Favorites |
| `/submit` | Map | Submit form (stub) | Submit |
| `/about` | Full page | N/A | About |

`/favorites` and `/submit` keep the map visible and only swap panel content. `/about` replaces the entire viewport.

**Note:** Favorites, Submit, and About routes are stubs for future implementation. This design only adds the routing structure; stub pages show placeholder content.

## Safe-Area & Touch Foundations

### index.html
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### global.css additions
```css
:root {
  --size-rail-width: 3.5rem;
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}
```

### Touch targets
- All interactive elements in rail, drawer, and sheet: minimum 44×44px
- Applied per-component in CSS modules, not globally

## Existing Infrastructure (already done)

- Breakpoint variables: `--breakpoint-xs` (450px), `--breakpoint-sm` (720px), `--breakpoint-md` (1080px), `--breakpoint-lg` (1440px)
- Custom media queries via PostCSS: `--smaller-than-sm`, `--larger-than-md`, etc.
- PostCSS plugins: `postcss-custom-media`, `postcss-custom-properties`
- Framer Motion for animations
- Radix UI for headless components
- CSS Modules for styling

## File Changes Summary

### New files
- `src/components/nav/nav-rail.tsx` — icon rail component
- `src/components/nav/nav-rail.module.css` — rail styles
- `src/components/nav/mobile-drawer.tsx` — mobile Sheet drawer
- `src/components/nav/mobile-drawer.module.css` — drawer styles
- `src/components/nav/bottom-sheet.tsx` — mobile bottom sheet
- `src/components/nav/bottom-sheet.module.css` — sheet styles

### Modified files
- `src/components/sidebar/sidebar.tsx` — restructure into rail + panel layout
- `src/components/sidebar/sidebar.module.css` — split into rail + panel flex layout
- `src/components/layout/header.tsx` — mobile: toggle triggers drawer
- `src/components/layout/header.module.css` — mobile breakpoint styles, safe-area insets
- `src/components/sidebar/nav-user.tsx` — move to rail footer / mobile drawer
- `src/stores/sidebar.ts` — add mobileDrawerOpen, mobileSheetState
- `src/styles/global.css` — add --size-rail-width, safe-area vars
- `src/vite-app.tsx` — wire new nav components
- `index.html` — viewport-fit=cover

### Deleted
- Sidebar footer section (about button, github link)

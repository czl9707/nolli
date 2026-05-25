# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interactive map for viewing architecture on a map. Vite + React 19 + TypeScript SPA with MapLibre GL.

**Design concept:** selecting an architecture on the map transitions to a horizontal-scroll detail view. The map shrinks to a small panel on the left, acting like one page in a portfolio/booklet, alongside content pages with text and images.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — generates map patterns, then builds (`generate:patterns` → `vite build`)
- `npm run start` — builds then serves via Express (`server.ts`, default port 3000)
- `npm run generate:patterns` — Sharp SVG→PNG texture generation into `public/patterns/` (gitignored)
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Prettier

No test framework is configured.

## Verification

```
npm run lint && npm run typecheck
```

## Architecture

- **Entrypoint**: `src/main.tsx` → `src/vite-app.tsx` (BrowserRouter, ThemeProvider, Map, routes)
- **Routing**: react-router — `/` (map home), `/arch/:slug` (architecture detail, currently placeholder)
- **Map**: MapLibre GL with CARTO vector tiles, custom programmatic style (`src/lib/map-style.ts`)
- **Theming**: light/dark via `data-theme` attribute on `<html>`; map textures generated per theme. ThemeProvider persists to localStorage; Ctrl/Cmd+D toggles theme
- **Data**: `src/lib/data/architectures.ts` — static architecture entries with coordinates, pages, photos, notes, links
- **Production**: Express static server (`server.ts`) with SPA fallback

## Layout modes

The app switches between two modes via `document.body.dataset.mode` (not React state), allowing CSS to query it directly:
- **home** — map fills the viewport
- **board** — pin-board detail view; map shrinks into a slot on a fixed canvas

The transition is animated with framer-motion variants (`SURFACE_VARIANTS` in `vite-app.tsx`). `SelectedArchProvider` reads the URL slug and provides the selected architecture to PinBoard via a ref.

## Pin-board system

`src/components/pin-board/board.tsx` renders architecture detail as scattered items on a canvas:

```
PinBoard
├── MapCore (inside mapSlot, anchored)
├── MetadataItem (title, architect, year, address)
├── LinkItem (Google Maps, Wikipedia, etc.)
├── NoteItem (free-form text)
└── PhotoItem (images with captions)
    └── Tape (decorative tape strip)
```

- **Layout algorithm** (`src/lib/pin-board-layout.ts`): collision-free placement — tries viewport positions first, falls back to full canvas. Items get random rotation via hashId
- **Panning**: `useBoardPan` hook implements zoom-anchored-to-cursor panning via framer-motion motion values
- **Paper clipping**: `paperClipPath` procedurally generates irregular paper edges using hashId + jitter
- **Item entry animations**: staggered fade+scale via framer-motion with delay per item (0.3s + index × 0.1s)

## Key directories

- `src/lib/map-texture/` — SVG pattern generators (water, grass, forest, building, landuse)
- `src/lib/map-style.ts` — MapLibre style spec builder (~740 lines)
- `src/lib/map-color.ts` — palette derivation from two base colors per theme
- `src/lib/pin-board-layout.ts` — collision-free placement algorithm
- `src/components/pin-board/` — board item components and board container
- `src/components/map/` — MapLibre wrapper and pattern loading
- `src/components/ui/` — shared primitives (button with Radix Slot, typography, map controls)
- `scripts/generate-patterns.ts` — reads map-texture modules, outputs PNGs via Sharp

## Style

- **CSS Modules** (`.module.css`) — NOT Tailwind. prettier-plugin-tailwindcss is installed but the project uses CSS Modules + PostCSS custom properties/custom media
- Path alias: `@/*` → `src/*`
- Prettier: no semicolons, double quotes, trailing comma es5
- PostCSS processes `var(--*)` and `@custom-media` at build time (`preserve: false`), so they become plain CSS in production
- CSS custom properties and breakpoints defined in `src/styles/global.css`

## Gotchas

- `public/patterns/` is gitignored; `npm run build` regenerates it. Dev server may fail without generated patterns if you haven't built.
- Map pattern loading (`use-map-patterns.ts`) fetches both light and dark themes simultaneously for instant theme switching.
- The README references Next.js/shadcn from an earlier version — this is a Vite + React project.

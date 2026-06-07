# Nolli

Interactive map for viewing architecture. A Vite + React 19 + TypeScript SPA where selecting an architecture on the map transitions to a horizontal-scroll detail view.

## Language

**Architecture**:
A building or structure with a dedicated detail view. The core domain entity.
_Avoid_: building (too generic), listing, entry

**Arch**:
The TypeScript type representing a fully-loaded architecture (slug, name, architect, year, address, photos, notes, links).
_Avoid_: architecture detail, full building

**ArchSummary**:
The TypeScript type for the lightweight version shown in lists and map markers (slug, name, architect, year, coordinates, coverImage).
_Avoid_: architecture preview, list item

**DataSource**:
The interface for loading architecture data. Currently implemented by `SqliteDataSource` over a Web Worker.
_Avoid_: repository, data service, API client

**Layout mode**:
The app-level display state — `home` (map fills viewport) or `board` (pin-board detail view). Derived from the URL.
_Avoid_: view mode, screen state

**Pin-board**:
The detail view: a canvas where architecture items (metadata, photos, notes, links) are scattered as pinned items around a small map slot.
_Avoid_: detail view, detail page, architecture page

**Board item**:
A single pinned element on the pin-board — metadata card, photo, note, or link set. Each is a `PlacedArchItem` with position and rotation from the layout algorithm.
_Avoid_: card, tile, widget

**Fly-to intent**:
Whether the map camera should animate to the selected architecture. `true` when selection comes from sidebar or URL navigation; `false` when the user clicked a map marker (already looking at it). Stored as `shouldFlyTo` in the arch-detail store.
_Avoid_: selection source, animation flag, fly-to flag

**Map style**:
The MapLibre style specification that controls how the map renders. Generated programmatically from a color palette and texture patterns.
_Avoid_: map theme, map config, tile style

**Transition**:
The animated switch between layout modes. Home-to-board shrinks the map and reveals the pin-board; board-to-home reverses it. Orchestrated via framer-motion variants.

**Filter**:
The criteria applied when querying architectures — architect IDs, city IDs, bounding box. Stored in `filterStore`, synced reactively to the `DataSource`.
_Avoid_: search, query, criteria

## Modules

**Data layer**: `src/lib/data/` — types, `DataSource` interface, SQLite worker, SQL queries
**Stores**: `src/stores/` — Zustand stores for theme, layout, sidebar, filter, arch-detail, db
**Map**: `src/components/map/` — MapLibre wrapper, pattern loading, clustering, markers
**Pin-board**: `src/components/pin-board/` — board canvas, item components, modal, pan hook
**Sidebar**: `src/components/sidebar/` — architecture list, cards, filter panel
**Layout sync**: `src/components/layout/` — URL-to-store synchronization modules
**Map style**: `src/lib/map-style.ts` — MapLibre style spec builder (~1000 lines)
**Map texture**: `src/lib/map-texture/` — SVG pattern generators (water, grass, forest, building)
**Map color**: `src/lib/map-color.ts` — palette derivation from two base colors per theme
**Board layout**: `src/lib/pin-board-layout.ts` — radial collision-free placement algorithm

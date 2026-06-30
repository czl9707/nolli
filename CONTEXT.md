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

**Workspace layout**: pnpm workspace. The app lives in `apps/nolli/`; shared code is extracted into `packages/{data,ui,map,board}` (package names `@nolli/*`, consumed via `workspace:*`). Packages are **source-exported** — their `exports` point at `./src/index.ts` and there is no per-package build; the consuming app's Vite + TypeScript resolve them directly.

**`@nolli/data`** (`packages/data/src/`) — domain types (`Arch`, `ArchSummary`, etc.), the `DataSource` interface, and the SQLite stack: `sqlite-source` (spawns the worker via `new Worker(new URL("./sqlite-worker.ts", import.meta.url))`), `sqlite-worker`, `sqlite-queries`, `worker-protocol`. Leaf package.

**`@nolli/ui`** (`packages/ui/src/`) — shared design-system layer: `Button`, typography, `Toaster`, animation `constants`, and the `theme` store. Leaf package. Both `@nolli/map` and `@nolli/board` depend on it.

**`@nolli/map`** (`packages/map/src/`) — the figure-ground look + MapLibre primitives: `map-style` (style spec builder), `map-color` (palette per theme), `map-texture/` (SVG pattern generators), `map-core/` (`Map`, `MapMarker`, `MapControls`, `useMapPatterns`, `useMapClustering`), and the texture `scripts/generate-patterns.ts`. Depends on `@nolli/ui` + `@nolli/data`.

**`@nolli/board`** (`packages/board/src/`) — the pinboard aesthetic primitives: `pin`, `paper-clip`, `pin-board-layout` (radial collision-free placement), the item components (`PhotoItem`, `BoardItem`, `BoardModal`, `NoteItem`, `LinkItem`), and `useBoardPan`. Depends on `@nolli/ui` + `@nolli/data`.

**App** (`apps/nolli/src/`) — routing, pages, app-coupled Zustand stores (`auth`, `db`, `filter`, `sidebar`, `arch-detail`, `favorites`), the remaining UI primitives, layout/header/footer, and the **app-coupled integrations** that wire packages to app state. These stay in the app even though their primitives live in a package: `pages/map/map-core/index.tsx` (builds clusters/markers from app stores) and `pages/map/pin-board/{index,pin-board-item,metadata-item}.tsx` (board orchestration; `metadata-item` reads `useArchDetailStore`).

_Architecture note_: a file that imports app stores/hooks is app-coupled and stays in `apps/nolli/src/`, even if the reusable primitives around it were extracted to a package.

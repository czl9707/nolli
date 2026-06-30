# Nolli

You visit a city. Look up the famous buildings on ArchDaily. Make a list. Still walk right past masterpieces — because no map tells you what's architecturally significant nearby, right where you're standing.

ArchDaily has the photos. No geography. Google Maps has the pins. No curation. Nobody connects what's worth seeing with where it is.

**Nolli is a map that makes sure you never miss a great building again.**

It has two halves: a **figure-ground map** for reading cities — heavy texture, clear solids and voids, the way Noli drew Rome in 1748. Click any building and the map unfolds into a **pin-up board** with drawings, photos, context, and notes. The map is how you navigate between buildings. The pin-up is where you understand each one.

---

Built with Vite + React 19 + TypeScript + MapLibre GL.

## Repo layout

This is a pnpm workspace. The app lives in `apps/nolli`; shared code is split into packages under `packages/` and consumed via `@nolli/*`:

- **`apps/nolli`** — the app (Vite + React + MapLibre). Workspace scripts at the root (`dev`, `build`, `lint`, etc.) delegate here.
- **`packages/ui`** — shared UI primitives and components (`@nolli/ui`).
- **`packages/data`** — domain types, data loading, and the seed/SQLite layer (`@nolli/data`).
- **`packages/map`** — the figure-ground map: textures, sources, and layers (`@nolli/map`).
- **`packages/board`** — the pin-up building-detail board (`@nolli/board`).

## Getting started

```bash
pnpm install
pnpm dev
```

The dev server requires generated map textures. `pnpm build` already runs the pattern generator; if you only need the textures without a full build, run it directly:

```bash
pnpm --filter nolli generate:patterns
```

## Commands

Run from the repo root (they delegate to the app via workspace scripts):

| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Generate patterns + production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check (all packages + app) |
| `pnpm format` | Prettier |

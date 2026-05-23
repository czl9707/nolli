# AGENTS.md

## Project

Interactive map for viewing architecture on a map. Vite + React 19 + TypeScript SPA with MapLibre GL.
**The README is stale** — it references Next.js/shadcn, but this is a Vite + React project.

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
- **Routing**: react-router — `/` (map home), `/arch/:slug` (architecture detail)
- **Map**: MapLibre GL with CARTO vector tiles, custom programmatic style (`src/lib/map-style.ts`)
- **Theming**: light/dark via `data-theme` attribute; map textures generated per theme
- **Data**: `src/lib/data/architectures.ts` — architecture entries with coordinates, pages (text + image)
- **Production**: Express static server (`server.ts`) with SPA fallback

## Key directories

- `src/lib/map-texture/` — SVG pattern generators (water, grass, forest, building, landuse)
- `src/lib/map-style.ts` — MapLibre style spec builder (~740 lines)
- `src/lib/map-color.ts` — palette derivation from two base colors per theme
- `scripts/generate-patterns.ts` — reads map-texture modules, outputs PNGs via Sharp

## Style

- **CSS Modules** (`.module.css`) — NOT Tailwind. prettier-plugin-tailwindcss is installed but the project uses CSS Modules + PostCSS custom properties/custom media
- Path alias: `@/*` → `src/*`
- Prettier: no semicolons, double quotes, trailing comma es5

## Gotchas

- `public/patterns/` is gitignored; `npm run build` regenerates it. Dev server may fail without generated patterns if you haven't built.

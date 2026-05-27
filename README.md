# Nolli

Interactive map for viewing architecture on a map. Built with Vite + React 19 + TypeScript + MapLibre GL.

## Getting started

```bash
npm install
npm run dev
```

The dev server requires generated map textures. If they're missing, run:

```bash
npm run generate:patterns
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Generate patterns + production build |
| `npm run start` | Build + serve via Express (port 3000) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier |

## Design concept

Selecting an architecture on the map transitions to a horizontal-scroll detail view. The map shrinks to a small panel on the left, acting like one page in a portfolio/booklet, alongside content pages with text and images.

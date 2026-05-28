# Nolli

You visit a city. Look up the famous buildings on ArchDaily. Make a list. Still walk right past masterpieces — because no map tells you what's architecturally significant nearby, right where you're standing.

ArchDaily has the photos. No geography. Google Maps has the pins. No curation. Nobody connects what's worth seeing with where it is.

**Nolli is a map that makes sure you never miss a great building again.**

It has two halves: a **figure-ground map** for reading cities — heavy texture, clear solids and voids, the way Noli drew Rome in 1748. Click any building and the map unfolds into a **pin-up board** with drawings, photos, context, and notes. The map is how you navigate between buildings. The pin-up is where you understand each one.

---

Built with Vite + React 19 + TypeScript + MapLibre GL.

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
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier |

# Arch Map — Architecture Portfolio

## Concept

Arch Map is an architecture portfolio/booklet presented through an interactive map experience.

## Core UX

**Homepage:** Map-dominant view with minimal white space around the edges and a solid header at top. The map fills most of the viewport.

**POI Interaction:** Clicking a point of interest (POI) on the map — each one a curated architecture — shrinks the map bounding box to a small box (50vh, max 400px width) positioned on the far left of the screen. This transitions the app into a horizontal scrolling portfolio experience.

**Portfolio Pages:** Each "page" in the horizontal scroll displays architecture detail info — description, images, external links, etc. The map remains visible as a small image on the left, like a page in a physical portfolio/booklet.

## Architecture Decisions

- **SPA** (Vite + React) — the map must stay mounted across all interactions, no page reloads
- **Express server** serves the static build + future API routes for user-generated content
- **react-router** will be added for individual arch paths (`/arch/[slug]`) while keeping the map mounted
- **User submissions** — later phase: users can add their own architecture entries

## Tech Stack

- Vite + React 19 + TypeScript
- MapLibre GL (custom styled map with SVG patterns)
- Tailwind CSS v4 + shadcn/ui
- Express (static serving + future API)
- Sharp (build-time pattern generation)

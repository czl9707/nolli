// apps/poster/src/lib/spotlight-types.ts

export const EDGES = ["top", "right", "bottom", "left"] as const
export type Edge = (typeof EDGES)[number]

export const CORNERS = ["start", "end"] as const
export type Corner = (typeof CORNERS)[number]

/** The image strip docks to the edge/corner opposite the caption. */
export const OPPOSITE_EDGE: Record<Edge, Edge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

/** The image corner is the caption corner flipped. */
export const OPPOSITE_CORNER: Record<Corner, Corner> = {
  start: "end",
  end: "start",
}

/**
 * The caption is the source of truth for position: it docks at `captionEdge` /
 * `captionCorner` in BOTH routes (overview has no image). The spotlight image
 * strip is fully derived — it docks at the opposite edge/corner — so there is
 * no separate "image layout" knob. The caption has two lines, primary and
 * secondary; `customPrimary` / `customSecondary` override the resolved text
 * when non-empty (spotlight only; ephemeral).
 */
export type CaptionSettings = {
  captionEdge: Edge
  captionCorner: Corner
  primarySize: number
  secondarySize: number
  customPrimary: string
  customSecondary: string
}

/** Defaults preserve the prior visual: image top-start, caption bottom-end. */
export const DEFAULT_CAPTION: CaptionSettings = {
  captionEdge: "bottom",
  captionCorner: "end",
  primarySize: 48,
  secondarySize: 20,
  customPrimary: "",
  customSecondary: "",
}

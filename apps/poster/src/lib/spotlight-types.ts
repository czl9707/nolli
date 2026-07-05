// apps/poster/src/lib/spotlight-types.ts

export const EDGES = ["top", "right", "bottom", "left"] as const
export type ImageEdge = (typeof EDGES)[number]

export const CORNERS = ["start", "end"] as const
export type Corner = (typeof CORNERS)[number]

/** The caption docks to the edge opposite the image strip. */
export const OPPOSITE_EDGE: Record<ImageEdge, ImageEdge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

/** The caption corner is the image corner flipped (image start → caption end). */
export const OPPOSITE_CORNER: Record<Corner, Corner> = {
  start: "end",
  end: "start",
}

export type SpotlightSettings = {
  imageEdge: ImageEdge
  imageCorner: Corner
  nameSize: number
  architectSize: number
  customName: string
  customArchitect: string
}

export const DEFAULT_SPOTLIGHT: SpotlightSettings = {
  imageEdge: "top",
  imageCorner: "start",
  nameSize: 48,
  architectSize: 20,
  customName: "",
  customArchitect: "",
}

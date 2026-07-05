// apps/poster/src/lib/spotlight-types.ts

export const EDGES = ["top", "right", "bottom", "left"] as const
export type ImageEdge = (typeof EDGES)[number]

export const CORNERS = ["start", "end"] as const
export type CaptionCorner = (typeof CORNERS)[number]

/** The caption docks to the edge opposite the image strip. */
export const OPPOSITE_EDGE: Record<ImageEdge, ImageEdge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

export type SpotlightSettings = {
  imageEdge: ImageEdge
  captionCorner: CaptionCorner
  nameSize: number
  architectSize: number
  customName: string
  customArchitect: string
}

export const DEFAULT_SPOTLIGHT: SpotlightSettings = {
  imageEdge: "top",
  captionCorner: "start",
  nameSize: 48,
  architectSize: 20,
  customName: "",
  customArchitect: "",
}

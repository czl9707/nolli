// apps/poster/src/lib/spotlight-types.ts

export const EDGES = ["top", "right", "bottom", "left"] as const
export type ImageEdge = (typeof EDGES)[number]

export const CORNERS = ["start", "end"] as const
export type CaptionCorner = (typeof CORNERS)[number]

export const DIRS = ["horizontal", "rotated"] as const
export type CaptionDir = (typeof DIRS)[number]

/** A concrete on-frame corner the caption can dock to. */
export type FrameCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export type SpotlightSettings = {
  imageEdge: ImageEdge
  captionCorner: CaptionCorner
  captionDirection: CaptionDir
  nameSize: number
  architectSize: number
  customName: string
  customArchitect: string
}

export const DEFAULT_SPOTLIGHT: SpotlightSettings = {
  imageEdge: "top",
  captionCorner: "start",
  captionDirection: "horizontal",
  nameSize: 48,
  architectSize: 20,
  customName: "",
  customArchitect: "",
}

/**
 * The caption always lives on the edge OPPOSITE the image, in one of that
 * edge's two corners, so it never collides with the strip. `start`/`end` are
 * read left-to-right along that opposite edge.
 */
export function resolveCaptionCorner(
  edge: ImageEdge,
  corner: CaptionCorner
): FrameCorner {
  switch (edge) {
    case "top":
      return corner === "start" ? "bottom-left" : "bottom-right"
    case "bottom":
      return corner === "start" ? "top-left" : "top-right"
    case "left":
      return corner === "start" ? "top-right" : "bottom-right"
    case "right":
      return corner === "start" ? "top-left" : "bottom-left"
  }
}

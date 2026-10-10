// Pure pointer-lean math: the cursor leans the eye over the map, so the
// map drifts a few px opposite the cursor — the layer's shape rect stays
// glued to the scene windows and the map leans inside its clip. The
// offset rides two CSS custom properties (--map-lean-x / -y, bare
// numbers) that the map wrapper consumes.

export type Point = { x: number; y: number }

/** Map shift at full cursor deflection (cursor on a viewport edge), px. */
export const PARALLAX_SHIFT_X = 16
export const PARALLAX_SHIFT_Y = 12

/** Exponential ease rate toward the cursor — a heavy sheet under the eye,
 * not a tracker. */
export const PARALLAX_RATE = 5

/** The map wrapper's overscan past its clip, px — covers the full lean so
 * the canvas edge can never show. */
export const MAP_LEAN_OVERSCAN = 24

/** Cursor position normalized to ±1 from the viewport center. */
export function pointerNorm(x: number, y: number, vw: number, vh: number): Point {
  return { x: (x / vw) * 2 - 1, y: (y / vh) * 2 - 1 }
}

/** The map's offset for a normalized cursor: opposite the cursor, so
 * cursor left sends the map right, cursor up sends it down. */
export function parallaxOffset(n: Point): Point {
  return { x: -n.x * PARALLAX_SHIFT_X, y: -n.y * PARALLAX_SHIFT_Y }
}

/** One exponential-ease step toward the target. */
export function easeToward(cur: Point, target: Point, dt: number): Point {
  const k = 1 - Math.exp(-PARALLAX_RATE * dt)
  return { x: cur.x + (target.x - cur.x) * k, y: cur.y + (target.y - cur.y) * k }
}

/** The map rests once it is within half a px of the cursor's ask. */
export function settled(cur: Point, target: Point): boolean {
  return Math.abs(cur.x - target.x) < 0.5 && Math.abs(cur.y - target.y) < 0.5
}

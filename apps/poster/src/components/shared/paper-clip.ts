// Mirrors @nolli/board's paper-clip helpers so the photo markers share the
// same torn-paper edge + deterministic tilt as nolli's pin board, without
// poster having to depend on the (framer-motion-heavy) board feature package.
// Keep these in sync with packages/board/src/paper-clip.ts.

export function jitter(seed: number, max: number): number {
  const x = Math.sin(seed * 10000 + 1) * 10000
  return (x - Math.floor(x)) * max
}

export function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return h
}

/**
 * Deterministic, slightly-irregular quadrilateral clip — the torn-paper edge
 * shared with @nolli/board. Keyed by id so a given building always gets the
 * same shape. Keep in sync with packages/board/src/paper-clip.ts.
 */
export function paperClipPath(id: string): string {
  const s = hashId(id)
  const j = 5
  const tl = `${jitter(s, j)}px ${jitter(s + 1, j)}px`
  const tr = `calc(100% - ${jitter(s + 2, j)}px) ${jitter(s + 3, j)}px`
  const br = `calc(100% - ${jitter(s + 4, j)}px) calc(100% - ${jitter(s + 5, j)}px)`
  const bl = `${jitter(s + 6, j)}px calc(100% - ${jitter(s + 7, j)}px)`
  return `polygon(${tl}, ${tr}, ${br}, ${bl})`
}

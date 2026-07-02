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

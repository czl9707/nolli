import type {
  Arch,
  ArchPhoto,
  ArchNote,
  ArchLinks,
} from "@nolli/data"

export const CANVAS_W = 2400
export const CANVAS_H = 1500
export const MAP_SLOT_W = 400
export const MAP_SLOT_H = 300
export const MAP_SLOT_X = CANVAS_W / 2 - MAP_SLOT_W - 100
export const MAP_SLOT_Y = CANVAS_H / 2 - MAP_SLOT_H - 100
export const BOARD_GAP = 60

export type Position = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type PlacedArchItem =
  | ({
      kind: "metadata"
      name: string
      architect: string
      year: number
      address: string
    } & { position: Position })
  | ({
      kind: "links"
      links: ArchLinks
    } & { position: Position })
  | ({
      kind: "photo"
      photo: ArchPhoto
    } & { position: Position })
  | ({
      kind: "note"
      note: ArchNote
    } & { position: Position })

export type PlacedItem = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type ItemSpec = {
  id: string
  width: number
  height: number
}

const RADIUS_START = 200
const RADIUS_STEP = 150
const ATTEMPTS_PER_RING = 30
const ROTATION_RANGE = 2

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap: number
): boolean {
  return (
    a.x - gap < b.x + b.width &&
    a.x + a.width + gap > b.x &&
    a.y - gap < b.y + b.height &&
    a.y + a.height + gap > b.y
  )
}

function tryPlaceNearAnchor(
  item: ItemSpec,
  anchorCenterX: number,
  anchorCenterY: number,
  startRadius: number,
  step: number,
  maxRadius: number,
  canvasWidth: number,
  canvasHeight: number,
  margin: number,
  placed: PlacedItem[],
  gap: number,
  attemptsPerRing: number
): { x: number; y: number } | null {
  const minCenterX = margin + item.width / 2
  const maxCenterX = canvasWidth - margin - item.width / 2
  const minCenterY = margin + item.height / 2
  const maxCenterY = canvasHeight - margin - item.height / 2

  for (let radius = startRadius; radius <= maxRadius; radius += step) {
    for (let i = 0; i < attemptsPerRing; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = startRadius + Math.random() * (radius - startRadius + step)
      const cx = Math.max(
        minCenterX,
        Math.min(maxCenterX, anchorCenterX + Math.cos(angle) * r)
      )
      const cy = Math.max(
        minCenterY,
        Math.min(maxCenterY, anchorCenterY + Math.sin(angle) * r)
      )
      const x = cx - item.width / 2
      const y = cy - item.height / 2

      const hasCollision = placed.some((p) =>
        rectsOverlap({ x, y, width: item.width, height: item.height }, p, gap)
      )
      if (!hasCollision) return { x, y }
    }
  }
  return null
}

function layoutPinBoard(
  items: ItemSpec[],
  canvasWidth: number,
  canvasHeight: number,
  anchorItem?: string,
  gap: number = 30,
  anchorX?: number,
  anchorY?: number
): PlacedItem[] {
  const placed: PlacedItem[] = []
  const margin = 60
  const maxRadius = Math.hypot(canvasWidth, canvasHeight)

  let cx = canvasWidth / 2
  let cy = canvasHeight / 2

  for (const item of items) {
    if (item.id === anchorItem) {
      const ax = anchorX ?? (canvasWidth - item.width) / 2
      const ay = anchorY ?? (canvasHeight - item.height) / 2
      cx = ax + item.width / 2
      cy = ay + item.height / 2
      placed.push({
        id: item.id,
        x: ax,
        y: ay,
        width: item.width,
        height: item.height,
        rotation: 0,
      })
      continue
    }

    const spot = tryPlaceNearAnchor(
      item,
      cx,
      cy,
      RADIUS_START,
      RADIUS_STEP,
      maxRadius,
      canvasWidth,
      canvasHeight,
      margin,
      placed,
      gap,
      ATTEMPTS_PER_RING
    )

    placed.push({
      id: item.id,
      x: spot?.x ?? randomInRange(margin, canvasWidth - item.width - margin),
      y: spot?.y ?? randomInRange(margin, canvasHeight - item.height - margin),
      width: item.width,
      height: item.height,
      rotation: randomInRange(-ROTATION_RANGE, ROTATION_RANGE),
    })
  }

  return placed
}

function clampDimensions(
  width: number,
  height: number,
  max = 500,
  min = 300
): { width: number; height: number } {
  if (Math.max(width, height) > max) {
    const s = max / Math.max(width, height)
    width *= s
    height *= s
  } else if (Math.min(width, height) < min) {
    const s = min / Math.min(width, height)
    if (Math.max(width, height) * s <= max) {
      width *= s
      height *= s
    }
  }
  return { width, height }
}

export function layoutArchBoard(arch: Arch): PlacedArchItem[] {
  const specs: ItemSpec[] = []

  specs.push({ id: "site-map", width: MAP_SLOT_W, height: MAP_SLOT_H })
  specs.push({ id: "metadata", width: 420, height: 200 })
  specs.push({ id: "links", width: 240, height: 360 })

  for (let i = 0; i < arch.notes.length; i++) {
    specs.push({ id: `note-${i}`, width: 240, height: 180 })
  }

  for (let i = 0; i < arch.photos.length; i++) {
    const photo = arch.photos[i]
    const { width, height } = clampDimensions(photo.width, photo.height)
    specs.push({ id: `photo-${i}`, width, height })
  }

  const placed = layoutPinBoard(
    specs,
    CANVAS_W,
    CANVAS_H,
    "site-map",
    BOARD_GAP,
    MAP_SLOT_X,
    MAP_SLOT_Y
  )

  const items: PlacedArchItem[] = []

  for (const p of placed) {
    const pos: Position = {
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      rotation: p.rotation,
    }

    if (p.id === "metadata") {
      items.push({
        kind: "metadata",
        name: arch.name,
        architect: arch.architect,
        year: arch.year,
        address: arch.address,
        position: pos,
      })
    } else if (p.id === "links") {
      items.push({
        kind: "links",
        links: arch.links,
        position: pos,
      })
    } else if (p.id.startsWith("photo-")) {
      const idx = parseInt(p.id.slice("photo-".length), 10)
      items.push({
        kind: "photo",
        photo: arch.photos[idx],
        position: pos,
      })
    } else if (p.id.startsWith("note-")) {
      const idx = parseInt(p.id.slice("note-".length), 10)
      items.push({
        kind: "note",
        note: arch.notes[idx],
        position: pos,
      })
    }
  }

  return items
}

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

const VIEWPORT_ATTEMPTS = 30
const CANVAS_ATTEMPTS = 30
const ROTATION_RANGE = 2

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap: number,
): boolean {
  return (
    a.x - gap < b.x + b.width &&
    a.x + a.width + gap > b.x &&
    a.y - gap < b.y + b.height &&
    a.y + a.height + gap > b.y
  )
}

function tryPlace(
  item: ItemSpec,
  maxX: number,
  maxY: number,
  margin: number,
  placed: PlacedItem[],
  gap: number,
  attempts: number,
): { x: number; y: number } | null {
  for (let i = 0; i < attempts; i++) {
    const x = randomInRange(margin, maxX - item.width - margin)
    const y = randomInRange(margin, maxY - item.height - margin)
    const hasCollision = placed.some((p) =>
      rectsOverlap({ x, y, width: item.width, height: item.height }, p, gap),
    )
    if (!hasCollision) return { x, y }
  }
  return null
}

export function layoutPinBoard(
  items: ItemSpec[],
  canvasWidth: number,
  canvasHeight: number,
  anchorItem?: string,
  gap: number = 30,
): PlacedItem[] {
  const placed: PlacedItem[] = []
  const margin = 60
  const vpW = Math.min(canvasWidth, window.innerWidth)
  const vpH = Math.min(canvasHeight, window.innerHeight)

  for (const item of items) {
    const isAnchor = item.id === anchorItem

    if (isAnchor) {
      placed.push({
        id: item.id,
        x: margin,
        y: margin,
        width: item.width,
        height: item.height,
        rotation: 0,
      })
      continue
    }

    // Try viewport first, then fall back to full canvas
    const spot =
      tryPlace(item, vpW, vpH, margin, placed, gap, VIEWPORT_ATTEMPTS) ??
      tryPlace(item, canvasWidth, canvasHeight, margin, placed, gap, CANVAS_ATTEMPTS)

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

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
  gap: number,
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
  attemptsPerRing: number,
): { x: number; y: number } | null {
  for (let radius = startRadius; radius <= maxRadius; radius += step) {
    for (let i = 0; i < attemptsPerRing; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = startRadius + Math.random() * (radius - startRadius + step)
      const x = anchorCenterX + Math.cos(angle) * r - item.width / 2
      const y = anchorCenterY + Math.sin(angle) * r - item.height / 2

      if (x < margin || y < margin) continue
      if (x + item.width > canvasWidth - margin) continue
      if (y + item.height > canvasHeight - margin) continue

      const hasCollision = placed.some((p) =>
        rectsOverlap({ x, y, width: item.width, height: item.height }, p, gap),
      )
      if (!hasCollision) return { x, y }
    }
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
  const maxRadius = Math.hypot(canvasWidth, canvasHeight)

  let anchorCenterX = canvasWidth / 2
  let anchorCenterY = canvasHeight / 2

  for (const item of items) {
    const isAnchor = item.id === anchorItem

    if (isAnchor) {
      placed.push({
        id: item.id,
        x: (canvasWidth - item.width) / 2,
        y: (canvasHeight - item.height) / 2,
        width: item.width,
        height: item.height,
        rotation: 0,
      })
      anchorCenterX = (canvasWidth - item.width) / 2 + item.width / 2
      anchorCenterY = (canvasHeight - item.height) / 2 + item.height / 2
      continue
    }

    const spot = tryPlaceNearAnchor(
      item,
      anchorCenterX,
      anchorCenterY,
      RADIUS_START,
      RADIUS_STEP,
      maxRadius,
      canvasWidth,
      canvasHeight,
      margin,
      placed,
      gap,
      ATTEMPTS_PER_RING,
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

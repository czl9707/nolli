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

const MIN_GAP = 30
const MAX_ATTEMPTS = 50
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

export function layoutPinBoard(
  items: ItemSpec[],
  canvasWidth: number,
  canvasHeight: number,
  anchorItem?: string,
): PlacedItem[] {
  const placed: PlacedItem[] = []
  const viewportW = Math.min(canvasWidth, window.innerWidth)
  const viewportH = Math.min(canvasHeight, window.innerHeight)
  const marginX = 60
  const marginY = 60

  for (const item of items) {
    const isAnchor = item.id === anchorItem
    let bestX: number
    let bestY: number
    let foundSpot = false

    if (isAnchor) {
      bestX = marginX
      bestY = marginY
      foundSpot = true
    } else {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidateX = randomInRange(marginX, viewportW - item.width - marginX)
        const candidateY = randomInRange(marginY, viewportH - item.height - marginY)

        const candidate = { x: candidateX, y: candidateY, width: item.width, height: item.height }
        const hasCollision = placed.some((p) =>
          rectsOverlap(candidate, { x: p.x, y: p.y, width: p.width, height: p.height }, MIN_GAP),
        )

        if (!hasCollision) {
          bestX = candidateX
          bestY = candidateY
          foundSpot = true
          break
        }
      }

      if (!foundSpot) {
        bestX = randomInRange(marginX, canvasWidth - item.width - marginX)
        bestY = randomInRange(marginY, canvasHeight - item.height - marginY)
      }
    }

    placed.push({
      id: item.id,
      x: bestX!,
      y: bestY!,
      width: item.width,
      height: item.height,
      rotation: isAnchor ? 0 : randomInRange(-ROTATION_RANGE, ROTATION_RANGE),
    })
  }

  return placed
}

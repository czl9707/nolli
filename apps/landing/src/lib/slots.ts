export type SlotRect = { x: number; y: number; w: number; h: number }

/** Read a length CSS var from the shared @nolli/ui tokens as px (rem resolves
 * against the root font size). Falls back outside the browser (tests). */
function cssVarPx(name: string, fallback: number): number {
  if (typeof getComputedStyle === "undefined") return fallback
  const raw = getComputedStyle(document.body).getPropertyValue(name).trim()
  const m = /^([\d.]+)(rem|px)$/.exec(raw)
  if (!m) return fallback
  if (m[2] === "px") return parseFloat(m[1])
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return parseFloat(m[1]) * root
}

/** Index plate: the map settles into a standalone rect on the right of the
 * city-list column. The two-column assembly (column + plate) is capped at
 * MAX_ASSEMBLY and centered — wide, but not ultrawide-stretched. The plate
 * is inset from the assembly edges (site header clearance above, component
 * padding elsewhere), so the cream page frames it on all sides. Returns the
 * viewport-fraction rect for the layer keyframes, the rect's px size for
 * camera fitting, and the column's viewport fractions for the panel. */
const LEFT_COL = 0.28
const HEADER_H = cssVarPx("--size-header-height", 56)
const MAX_ASSEMBLY = 1440
const PADDING = cssVarPx("--spacing-component", 32)

export function indexPlate(vw: number, vh: number): {
  rect: SlotRect
  px: { width: number; height: number }
  column: { left: number; width: number }
} {
  const top = HEADER_H + PADDING
  const assemblyW = Math.min(vw, MAX_ASSEMBLY)
  const marginX = (vw - assemblyW) / 2
  const colW = LEFT_COL * assemblyW
  const x0 = marginX + colW + PADDING
  const x1 = marginX + assemblyW - PADDING
  const rect = {
    x: x0 / vw,
    y: top / vh,
    w: (x1 - x0) / vw,
    h: 1 - (top + PADDING) / vh,
  }
  return {
    rect,
    px: { width: rect.w * vw, height: rect.h * vh },
    column: { left: marginX / vw, width: colW / vw },
  }
}

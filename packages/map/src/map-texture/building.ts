import { type Theme } from "./constant"
import { MAP_COLORS } from "../map-color"

function hatchPattern(
  bg: string | null,
  stroke: string,
  strokeWidth: number
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  ${bg ? `<rect x="-1" y="-1" width="34" height="34" fill="${bg}"/>` : ""}
  <g stroke="${stroke}" stroke-width="${strokeWidth}">
    <line x1="0" y1="0" x2="32" y2="32"/>
    <line x1="0" y1="8" x2="24" y2="32"/>
    <line x1="24" y1="0" x2="32" y2="8"/>
    <line x1="0" y1="16" x2="16" y2="32"/>
    <line x1="16" y1="0" x2="32" y2="16"/>
    <line x1="0" y1="24" x2="8" y2="32"/>
    <line x1="8" y1="0" x2="32" y2="24"/>
  </g>
</svg>`
}

export function buildingPattern(theme: Theme): string {
  const c = MAP_COLORS[theme]
  return hatchPattern(c.buildingBg, c.buildingStroke, theme == "dark" ? 1.5 : 2)
}

export function landusePattern(theme: Theme): string {
  const c = MAP_COLORS[theme]
  return hatchPattern(null, c.landuseStroke, theme == "dark" ? 1.5 : 2)
}

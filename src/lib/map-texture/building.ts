import { type Theme } from "./constant"
import { MAP_COLORS } from "@/lib/map-color"

export function buildingPattern(theme: Theme): string {
  const c = MAP_COLORS[theme]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${c.buildingBg}"/>
  <g stroke="${c.buildingStroke}" stroke-width="0.75" opacity="0.75">
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

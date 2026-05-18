import { type Theme } from "./constant"
import { MAP_COLORS } from "@/lib/map-color"

export function grassPattern(theme: Theme): string {
  const colors = {
    light: { bg: MAP_COLORS.light.bg },
    dark: { bg: MAP_COLORS.dark.bg },
  }
  const c = colors[theme]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <filter id="nnnoise-filter" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="5" seed="15" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence"/>
      <feSpecularLighting surfaceScale="10" specularConstant="0.9" specularExponent="20" lighting-color="#ff0000" x="0%" y="0%" width="100%" height="100%" in="turbulence" result="specularLighting">
        <feDistantLight azimuth="3" elevation="100"/>
      </feSpecularLighting>
      <feColorMatrix type="saturate" values="0" x="0%" y="0%" width="100%" height="100%" in="specularLighting" result="colormatrix"/>
    </filter>
  </defs>
  <rect width="258" height="258" cx="128" cy="128" fill="${c.bg}"/>
  <rect width="256" height="256" fill="#ff0000" filter="url(#nnnoise-filter)" opacity="0.4"/>
</svg>`
}

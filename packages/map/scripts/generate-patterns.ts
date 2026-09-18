import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { THEMES, type Theme } from "../src/map-texture/constant"
import { MAP_COLORS } from "../src/map-color"
import { waterPattern } from "../src/map-texture/water"
import { grassPattern } from "../src/map-texture/grass"
import { forestPattern } from "../src/map-texture/forest"
import {
  buildingPattern,
  landusePattern,
} from "../src/map-texture/building"

const patterns: Record<string, (theme: Theme) => string> = {
  water: waterPattern,
  grass: grassPattern,
  forest: forestPattern,
  building: buildingPattern,
  landuse: landusePattern,
}

// noise patterns render as black alpha masks (librsvg runs filters on
// premultiplied alpha, so a colored collapse can't come out straight) —
// the ink is applied here: a flat palette-color layer masked to the
// texture's alpha (dest-in). landcoverStroke is the marks ink (c(100)),
// already the color forest's circles draw with, so it leaves them as-is.
const INKED = new Set(["grass", "forest"])

async function render(name: string, theme: Theme, svg: string): Promise<Buffer> {
  const mask = await sharp(Buffer.from(svg)).png().toBuffer()
  if (!INKED.has(name)) return mask
  const ink = MAP_COLORS[theme].landcoverStroke
  const r = parseInt(ink.slice(1, 3), 16)
  const g = parseInt(ink.slice(3, 5), 16)
  const b = parseInt(ink.slice(5, 7), 16)
  const { width, height } = await sharp(mask).metadata()
  return sharp({
    create: { width: width!, height: height!, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer()
}

const OUT_DIR = join(process.cwd(), "public", "patterns")

async function main() {
  for (const theme of THEMES) {
    for (const [name, fn] of Object.entries(patterns)) {
      const png = await render(name, theme, fn(theme))

      const dir = join(OUT_DIR, theme)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `${name}.png`), png)
      console.log(`  generated: patterns/${theme}/${name}.png`)
    }
  }
}

main()

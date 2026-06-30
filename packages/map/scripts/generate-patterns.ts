import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { THEMES, type Theme } from "../src/map-texture/constant"
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

const OUT_DIR = join(process.cwd(), "public", "patterns")

async function main() {
  for (const theme of THEMES) {
    for (const [name, fn] of Object.entries(patterns)) {
      const svg = fn(theme)
      const png = await sharp(Buffer.from(svg)).png().toBuffer()

      const dir = join(OUT_DIR, theme)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `${name}.png`), png)
      console.log(`  generated: patterns/${theme}/${name}.png`)
    }
  }
}

main()

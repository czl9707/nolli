import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { THEMES, type Theme } from "../src/lib/map-texture/constant"
import { waterPattern } from "../src/lib/map-texture/water"
import { grassPattern } from "../src/lib/map-texture/grass"
import { forestPattern } from "../src/lib/map-texture/forest"
import { buildingPattern, landusePattern } from "../src/lib/map-texture/building"

const __dirname = dirname(fileURLToPath(import.meta.url))

const patterns: Record<string, (theme: Theme) => string> = {
  water: waterPattern,
  grass: grassPattern,
  forest: forestPattern,
  building: buildingPattern,
  landuse: landusePattern,
}

const OUT_DIR = join(__dirname, "..", "public", "patterns")

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

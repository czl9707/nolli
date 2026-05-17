import { type Theme } from "./_constant"

export function waterPattern(theme: Theme): string {
  const colors = {
    light: { bg: "#fff", stroke: "#000" },
    dark: { bg: "#000", stroke: "#fff" },
  }
  const c = colors[theme]

  const baseXs: [string, number][] = [
    ["a", 8], ["b", 4], ["c", 28], ["d", 16],
    ["e", 36], ["f", 40], ["g", 24], ["h", 14],
  ]
  const yOrder = ["a", "c", "d", "e", "b", "f", "h", "g"]

  let defs = ""
  let uses = ""

  for (const [id, startX] of baseXs) {
    const xs = Array.from({ length: 32 }, (_, i) => startX + i * 64)
    const lines = xs.map((x) => `<line x1="${x}" y1="0" x2="${x + 32}" y2="0"/>`).join("")
    defs += `<g id="r-${id}">${lines}</g>`
  }

  for (let tile = 0; tile < 16; tile++) {
    const baseY = tile * 128 + 8
    for (let row = 0; row < 8; row++) {
      const y = baseY + row * 16
      const rowId = yOrder[row]
      uses += `<use href="#r-${rowId}" y="${y}"/>`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
<rect width="2048" height="2048" fill="${c.bg}"/>
<defs>${defs}</defs>
<g stroke="${c.stroke}" stroke-width=".5">${uses}</g>
</svg>`
}

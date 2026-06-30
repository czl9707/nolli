function lerpColor(from: string, to: string, t: number): string {
  const r1 = parseInt(from.slice(1, 3), 16)
  const g1 = parseInt(from.slice(3, 5), 16)
  const b1 = parseInt(from.slice(5, 7), 16)
  const r2 = parseInt(to.slice(1, 3), 16)
  const g2 = parseInt(to.slice(3, 5), 16)
  const b2 = parseInt(to.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
}

function createPalette(bg: string, water: string) {
  const c = (pct: number) => lerpColor(bg, water, pct / 100)
  return {
    bg: c(0),
    boundary: c(60),

    roadLine: c(10),
    roadCase: c(100),
    roadFill: c(20),
    roadLinePri: c(10),
    roadCasePri: c(100),
    roadFillPri: c(50),
    roadLineMot: c(5),
    roadCaseMot: c(80),
    roadFillMot: c(40),
    roadLineTrunk: c(5),
    roadCaseTrunk: c(80),
    roadFillTrunk: c(40),

    waterBg: c(100),
    waterStroke: c(0),
    landcoverStroke: c(100),
    buildingBg: c(0),
    buildingStroke: c(100),
    landuseStroke: c(60),

    waterLabelColor: c(0),
    waterLabelHalo: c(80),
    priLabel: c(100),
    secLabel: c(100),
    minorLabel: c(100),
    labelHalo: c(40),
  }
}

export const MAP_COLORS = {
  light: createPalette("#e8e2da", "#1E1E1E"),
  dark: createPalette("#1E1E1E", "#EDEAE1"),
}

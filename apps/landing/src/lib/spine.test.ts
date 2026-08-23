import { describe, expect, it } from "vitest"
import { SCENES, cameraTargetAt, sceneFade, snap, spineAt } from "./spine"

const s = SCENES // hero 180 / index 200 / closeup 240 / cta 160 / footer 80
const total = SCENES.reduce((sum, sc) => sum + sc.heightVh, 0)
const range = (i: number) => ({
  start: SCENES.slice(0, i).reduce((sum, sc) => sum + sc.heightVh, 0) / total,
  end: SCENES.slice(0, i + 1).reduce((sum, sc) => sum + sc.heightVh, 0) / total,
})

describe("spineAt morph", () => {
  // hand-computed rects (viewport fractions, x/y = top-left edges):
  //   hero/cta/footer {0,0,1,1}
  //   index    = INDEX_SLOT {cx:.62,cy:.55,w:.42,h:.66}   → {x:.41, y:.22, w:.42, h:.66}
  //   closeup  = CLOSEUP_SLOT {cx:.3,cy:.5,w:.26,h:.34}   → {x:.17, y:.33, w:.26, h:.34}
  const full = { x: 0, y: 0, w: 1, h: 1 }
  const eqRect = (got: ReturnType<typeof spineAt>, want: { x: number; y: number; w: number; h: number }) => {
    for (const k of ["x", "y", "w", "h"] as const) expect(got[k]).toBeCloseTo(want[k], 10)
  }
  it("holds the scene keyframe through dwell", () => {
    const p = (180 * 0.5) / total // mid hero dwell
    eqRect(spineAt(s, p), full)
  })
  it("dwells exactly on the slot rect for index and closeup", () => {
    eqRect(spineAt(s, (180 + 200 * 0.5) / total), { x: 0.41, y: 0.22, w: 0.42, h: 0.66 })
    eqRect(spineAt(s, (180 + 200 + 240 * 0.5) / total), { x: 0.17, y: 0.33, w: 0.26, h: 0.34 })
  })
  it("last scene dwells to the end", () => {
    eqRect(spineAt(s, 1), full)
  })
  it("reaches the next keyframe exactly at the scene boundary", () => {
    const p = (180 + 200) / total // end of index range
    eqRect(spineAt(s, p), { x: 0.17, y: 0.33, w: 0.26, h: 0.34 })
  })
  it("applies easeInOutCubic, not linear, during transition", () => {
    const p = (180 + 200 * 0.7) / total // index local 0.7 → t = 0.25 → eased 0.0625
    const e = 0.0625
    const lerp = (a: number, b: number) => a + e * (b - a)
    eqRect(spineAt(s, p), {
      x: lerp(0.41, 0.17),
      y: lerp(0.22, 0.33),
      w: lerp(0.42, 0.26),
      h: lerp(0.66, 0.34),
    })
  })
  it("clamps out-of-range progress", () => {
    eqRect(spineAt(s, -0.2), full)
    eqRect(spineAt(s, 1.2), full)
  })
  it("stays a valid viewport rect at every step of the spine", () => {
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const r = spineAt(s, p)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9)
      expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9)
      expect(r.w).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThan(0)
    }
  })
})

describe("cameraTargetAt", () => {
  it("targets current scene during dwell, next scene during transition", () => {
    expect(cameraTargetAt(s, 0).id).toBe("hero")
    const inTransition = (180 * 0.8) / total
    expect(cameraTargetAt(s, inTransition).id).toBe("index")
    expect(cameraTargetAt(s, 1).id).toBe("footer")
  })
  it("targets a scene in the table at every step of the spine", () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      expect(s).toContain(cameraTargetAt(s, p))
    }
  })
})

describe("sceneFade", () => {
  it("first scene visible from 0", () => expect(sceneFade(s, "hero", 0)).toBe(1))
  it("middle scenes ramp 0→1→0", () => {
    expect(sceneFade(s, "index", 0.1)).toBe(0)
    expect(sceneFade(s, "index", range(1).start + (200 / total) * 0.3)).toBe(1) // mid dwell
    expect(sceneFade(s, "index", 0.95)).toBe(0)
  })
  it("last scene holds 1", () => expect(sceneFade(s, "footer", 1)).toBe(1))
  it("fades in over the quarter-scene approach before the scene starts", () => {
    const { start } = range(1)
    const len = 200 / total
    expect(sceneFade(s, "index", start - len * 0.3)).toBe(0)
    expect(sceneFade(s, "index", start - len * 0.125)).toBeCloseTo(0.5)
    expect(sceneFade(s, "index", start + 0.01)).toBe(1)
  })
  it("boundary exactness: dwellEnd -> 1, fadeEnd -> 0", () => {
    const { start } = range(1)
    const len = 200 / total
    expect(sceneFade(s, "index", start + len * 0.6)).toBe(1)
    expect(sceneFade(s, "index", start + len * 0.8)).toBe(0)
  })
  it("last scene is 0 before its approach window", () => {
    const { start } = range(4)
    const len = 80 / total
    expect(sceneFade(s, "footer", start - len * 0.3)).toBe(0)
  })
  it("at most the active scene plus one cross-fading neighbor is visible", () => {
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const visible = s.filter((sc) => sceneFade(s, sc.id, p) > 0)
      expect(visible.length).toBeLessThanOrEqual(2)
      if (visible.length === 2) {
        expect(s.indexOf(visible[1]) - s.indexOf(visible[0])).toBe(1)
      }
    }
  })
  it("neighbor handoff leaves no dead zone over 1.5% of scroll", () => {
    // overlay pairs crossfade: gap = 0.2*cur.len - 0.25*next.len; the short
    // 80vh footer approach would leave ~1.4%, but the cta pair is excluded
    // (see the flow-handoff test below) so only overlay pairs are checked here
    for (let i = 0; i < s.length - 2; i++) {
      const cur = range(i)
      const next = range(i + 1)
      const curGone = cur.start + (cur.end - cur.start) * 0.8
      const nextIn = next.start - (next.end - next.start) * 0.25
      expect(nextIn - curGone).toBeLessThanOrEqual(0.015)
    }
  })
  it("cta hands off to the flow-mounted footer at the scene boundary", () => {
    // no overlay crossfade against the footer: cta copy lingers across its
    // whole outgoing transition and is gone exactly when the footer block
    // arrives (~footer.start in scroll space)
    const cta = range(3)
    expect(sceneFade(s, "cta", cta.start + (cta.end - cta.start) * 0.8)).toBeCloseTo(0.5, 6)
    expect(sceneFade(s, "cta", cta.end - 1e-9)).toBeGreaterThan(0)
    expect(sceneFade(s, "cta", cta.end)).toBe(0)
  })
})

describe("snap", () => {
  it("quantizes to scene starts", () => {
    expect(snap(s, 0.5)).toBeLessThan(0.5)
    expect(snap(s, 0)).toBe(0)
  })
  it("returns the containing scene's range start", () => {
    const r = range(2)
    expect(snap(s, (r.start + r.end) / 2)).toBe(r.start)
  })
  it("returns the previous scene's start just below a boundary", () => {
    expect(snap(s, range(1).start - 1e-9)).toBe(0)
    expect(snap(s, range(2).start - 1e-9)).toBe(range(1).start)
  })
  it("returns 1 at the end of the scroll", () => {
    expect(snap(s, 1)).toBe(1)
  })
  it("snapped progress dwells exactly on scene keyframes", () => {
    for (const p of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
      expect(s.map((sc) => sc.layer)).toContain(spineAt(s, snap(s, p)))
    }
  })
})

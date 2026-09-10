import { describe, it, expect } from "vitest";
import { ONE_PIN_VP, haversine, lerp, projectToWindow } from "./viewport";

describe("viewport", () => {
  it("lerps between two numbers", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
  it("haversine measures distance", () => {
    expect(haversine({ lng: 0, lat: 0 }, { lng: 0, lat: 0 })).toBe(0);
    const d = haversine({ lng: 0, lat: 0 }, { lng: 180, lat: 0 });
    expect(d).toBeGreaterThan(19000);
    expect(d).toBeLessThan(21000);
  });
});

describe("projectToWindow", () => {
  const W = 952, H = 498;
  it("places the viewport center at the plate center", () => {
    const [x, y] = projectToWindow(ONE_PIN_VP.center[0], ONE_PIN_VP.center[1], ONE_PIN_VP, W, H);
    expect(x).toBeCloseTo(W / 2, 6);
    expect(y).toBeCloseTo(H / 2, 6);
  });
  it("shifts east by the mercator x-scale (degrees → px)", () => {
    const dLng = 10;
    const [x] = projectToWindow(ONE_PIN_VP.center[0] + dLng, ONE_PIN_VP.center[1], ONE_PIN_VP, W, H);
    const ws = 512 * 2 ** ONE_PIN_VP.zoom;
    expect(x).toBeCloseTo(W / 2 + (dLng / 360) * ws, 6);
  });
  it("picks the nearest world copy across the dateline", () => {
    // -170° == 190°E: 165° east of center 25° — must land right of center,
    // not wrapped to the far left.
    const [x] = projectToWindow(-170, ONE_PIN_VP.center[1], ONE_PIN_VP, W, H);
    const ws = 512 * 2 ** ONE_PIN_VP.zoom;
    expect(x).toBeCloseTo(W / 2 + (165 / 360) * ws, 6);
  });
});

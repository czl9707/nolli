import { describe, it, expect } from "vitest";
import { lerp, haversine, flyViewport, walkViewport, fitViewport } from "./viewport";
import type { ReelBuilding } from "./config";

const bb = (lng: number, lat: number): ReelBuilding =>
  ({ slug: "x", name: "X", year: 0, city: "c", country: "cy", countryCode: "", coordinates: { lng, lat }, coverImage: "", photoCount: 1 });

describe("viewport", () => {
  it("lerps between two numbers", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
  it("flyViewport interpolates center between consecutive buildings", () => {
    const buildings = [bb(0, 0), bb(10, 20)];
    const v0 = flyViewport(buildings, 0, 0, 6);
    const v1 = flyViewport(buildings, 0, 1, 6);
    expect(v0.center).toEqual([0, 0]);
    expect(v1.center[0]).toBeCloseTo(10, 5);
    expect(v1.center[1]).toBeCloseTo(20, 5);
  });
  it("flyViewport dips zoom mid-flight (maplibre arc)", () => {
    const buildings = [bb(0, 0), bb(10, 20)];
    const vStart = flyViewport(buildings, 0, 0, 14);
    const vEnd = flyViewport(buildings, 0, 1, 14);
    expect(vStart.zoom).toBeCloseTo(14, 5);
    expect(vEnd.center[0]).toBeCloseTo(10, 5);
    // Somewhere in flight the zoom dips below cruise (eased, so not at 0.5).
    let minZoom = Infinity;
    for (let i = 1; i < 100; i++) {
      const z = flyViewport(buildings, 0, i / 100, 14).zoom;
      minZoom = Math.min(minZoom, z);
    }
    expect(minZoom).toBeLessThan(13);
  });
  it("walkViewport flies in from the previous building, then holds", () => {
    const buildings = [bb(0, 0), bb(10, 20), bb(20, 0)];
    const opts = { flyFrac: 0.6, worldCenter: [0, 0] as [number, number], worldZoom: 1 };
    const vFlyStart = walkViewport(buildings, 1, 0, 15, opts);   // start of fly-in: at building 0
    const vHold = walkViewport(buildings, 1, 0.8, 15, opts);     // past flyFrac: held on building 1
    expect(vFlyStart.center[0]).toBeCloseTo(0, 5);
    expect(vHold.center[0]).toBeCloseTo(10, 5);
    expect(vHold.center[1]).toBeCloseTo(20, 5);
    expect(vHold.zoom).toBe(15);
  });
  it("walkViewport is continuous across slot boundaries", () => {
    const buildings = [bb(0, 0), bb(10, 20), bb(20, 0)];
    const opts = { flyFrac: 0.6, worldCenter: [0, 0] as [number, number], worldZoom: 1 };
    // end of slot 1 (held on building 1) == start of slot 2 (fly-in from building 1)
    const endSlot1 = walkViewport(buildings, 1, 1, 15, opts);
    const startSlot2 = walkViewport(buildings, 2, 0, 15, opts);
    expect(endSlot1.center[0]).toBeCloseTo(startSlot2.center[0], 5);
    expect(endSlot1.center[1]).toBeCloseTo(startSlot2.center[1], 5);
  });
  it("walkViewport slot 0 flies world -> building[0]", () => {
    const buildings = [bb(139.76, 35.68), bb(0, 0), bb(20, 0)];
    const worldCenter: [number, number] = [70, 17];
    const opts = { flyFrac: 0.6, worldCenter, worldZoom: 1 };
    const vStart = walkViewport(buildings, 0, 0, 15, opts);
    const vEnd = walkViewport(buildings, 0, 1, 15, opts);
    expect(vStart.center[0]).toBeCloseTo(70, 5);
    expect(vStart.zoom).toBeCloseTo(1, 5);
    expect(vEnd.center[0]).toBeCloseTo(139.76, 3);
    expect(vEnd.zoom).toBeCloseTo(15, 5);
  });
  it("flyViewport dips further for longer hops", () => {
    const minZoomOver = (bs: ReelBuilding[]) => {
      let m = Infinity;
      for (let i = 1; i < 100; i++) m = Math.min(m, flyViewport(bs, 0, i / 100, 15).zoom);
      return m;
    };
    const nearMin = minZoomOver([bb(0, 0), bb(0.01, 0.01)]); // ~1.5 km
    const farMin = minZoomOver([bb(0, 0), bb(150, 0)]); // ~16000 km
    expect(farMin).toBeLessThan(nearMin);
    expect(farMin).toBeLessThanOrEqual(6.5);
    expect(nearMin).toBeGreaterThan(10);
  });
  it("haversine measures distance", () => {
    expect(haversine({ lng: 0, lat: 0 }, { lng: 0, lat: 0 })).toBe(0);
    const d = haversine({ lng: 0, lat: 0 }, { lng: 180, lat: 0 });
    expect(d).toBeGreaterThan(19000);
    expect(d).toBeLessThan(21000);
  });
  it("fitViewport centers on the bbox midpoint with a bounded zoom", () => {
    const v = fitViewport([bb(-10, -5), bb(10, 5)], 6);
    expect(v.center[0]).toBeCloseTo(0);
    expect(v.center[1]).toBeCloseTo(0);
    expect(v.zoom).toBeGreaterThan(0);
    expect(v.zoom).toBeLessThanOrEqual(6);
  });
});

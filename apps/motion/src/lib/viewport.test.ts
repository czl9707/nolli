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
  it("walkViewport holds then flies with explicit hold fraction", () => {
    const buildings = [bb(0, 0), bb(10, 20), bb(20, 0)];
    const holdFrac = 0.4;
    const vHold = walkViewport(buildings, 1, 0.2, 15, { holdFrac });
    const vFlyEnd = walkViewport(buildings, 1, 1, 15, { holdFrac });
    expect(vHold.center).toEqual([10, 20]);
    expect(vHold.zoom).toBe(15);
    expect(vFlyEnd.center[0]).toBeCloseTo(20, 5);
    expect(vFlyEnd.center[1]).toBeCloseTo(0, 5);
  });
  it("walkViewport never self-flies the last building", () => {
    const buildings = [bb(0, 0), bb(10, 20), bb(20, 0)];
    const v = walkViewport(buildings, 2, 0.9, 15, { holdFrac: 0.4 });
    expect(v.center).toEqual([20, 0]);
    expect(v.zoom).toBe(15);
  });
  it("walkViewport slot 0 flies world -> building[0]", () => {
    const buildings = [bb(139.76, 35.68), bb(0, 0), bb(20, 0)];
    const worldCenter: [number, number] = [70, 17];
    const vStart = walkViewport(buildings, 0, 0, 15, { holdFrac: 0.4, fromWorld: true, worldCenter, worldZoom: 1 });
    const vEnd = walkViewport(buildings, 0, 1, 15, { holdFrac: 0.4, fromWorld: true, worldCenter, worldZoom: 1 });
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

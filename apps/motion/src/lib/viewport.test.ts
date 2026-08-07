import { describe, it, expect } from "vitest";
import { lerp, flyViewport, fitViewport } from "./viewport";
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
    expect(v1.center).toEqual([10, 20]);
  });
  it("flyViewport dips zoom mid-flight (cinematic arc)", () => {
    const buildings = [bb(0, 0), bb(10, 20)];
    const vStart = flyViewport(buildings, 0, 0, 14);
    const vMid = flyViewport(buildings, 0, 0.5, 14);
    expect(vStart.zoom).toBe(14);
    expect(vMid.zoom).toBeLessThan(vStart.zoom);
    expect(vMid.center).toEqual([5, 10]);
  });
  it("fitViewport centers on the bbox midpoint with a bounded zoom", () => {
    const v = fitViewport([bb(-10, -5), bb(10, 5)], 6);
    expect(v.center[0]).toBeCloseTo(0);
    expect(v.center[1]).toBeCloseTo(0);
    expect(v.zoom).toBeGreaterThan(0);
    expect(v.zoom).toBeLessThanOrEqual(6);
  });
});

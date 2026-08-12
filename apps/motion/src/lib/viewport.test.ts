import { describe, it, expect } from "vitest";
import { lerp, haversine, fitViewport } from "./viewport";
import type { ReelBuilding } from "./config";

const bb = (lng: number, lat: number): ReelBuilding =>
  ({ slug: "x", name: "X", year: 0, city: "c", countryCode: "", coordinates: { lng, lat }, coverImage: "" });

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
  it("fitViewport centers on the bbox midpoint with a bounded zoom", () => {
    const v = fitViewport([bb(-10, -5), bb(10, 5)], 6);
    expect(v.center[0]).toBeCloseTo(0);
    expect(v.center[1]).toBeCloseTo(0);
    expect(v.zoom).toBeGreaterThan(0);
    expect(v.zoom).toBeLessThanOrEqual(6);
  });
});

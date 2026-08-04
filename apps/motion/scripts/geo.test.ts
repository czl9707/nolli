import { describe, it, expect } from "vitest";
import { haversine, farthestFrom } from "./geo";
import type { BuildingRow } from "./manifest";

const row = (
  slug: string,
  latitude: number,
  longitude: number,
): BuildingRow => ({
  slug,
  name: slug,
  year: 2000,
  city: "",
  cc: "",
  latitude,
  longitude,
});

describe("haversine", () => {
  it("matches a known city-pair distance within ~1%", () => {
    // NYC (40.71, -74.01) <-> London (51.51, -0.13) ≈ 5570 km
    const d = haversine(40.71, -74.01, 51.51, -0.13);
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(5640);
  });

  it("is zero for identical points", () => {
    expect(haversine(10, 20, 10, 20)).toBe(0);
  });
});

describe("farthestFrom", () => {
  it("returns the building with the greatest great-circle distance from the origin", () => {
    const rows = [
      row("origin", 0, 0),
      row("near", 0, 10),
      row("far", 0, 50),
    ];
    expect(farthestFrom(rows, "origin").slug).toBe("far");
  });

  it("falls back to the first row if the origin slug is absent", () => {
    const rows = [row("a", 0, 0), row("b", 0, 30)];
    expect(farthestFrom(rows, "missing").slug).toBe("b");
  });

  it("throws on empty input", () => {
    expect(() => farthestFrom([], "x")).toThrow();
  });
});

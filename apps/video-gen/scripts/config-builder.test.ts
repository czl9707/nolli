import { describe, it, expect } from "vitest";
import { buildReelConfig } from "./config-builder";
import { reelTitle, yearRange } from "../src/lib/config";
import type { ReelBuilding } from "../src/lib/config";

const buildings: ReelBuilding[] = [
  { slug: "a", name: "A", year: 1958, city: "New York", countryCode: "US", coordinates: { lng: -74, lat: 40 }, coverImage: "https://a" },
  { slug: "b", name: "B", year: 1928, city: "Berlin", countryCode: "DE", coordinates: { lng: 13, lat: 52 }, coverImage: "https://b" },
];

describe("buildReelConfig", () => {
  it("sorts buildings chronologically", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings });
    expect(cfg.buildings.map((b) => b.slug)).toEqual(["b", "a"]);
  });

  it("throws if fewer than 2 buildings", () => {
    expect(() => buildReelConfig({ slug: "x", architect: "X", buildings: [buildings[0]] })).toThrow();
  });

  it("derives the year range and the name-only corner title", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings });
    expect(yearRange(cfg)).toBe("1928–1958");
    expect(reelTitle(cfg)).toBe("Mies");
  });
});

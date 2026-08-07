import { describe, it, expect } from "vitest";
import { buildReelConfig } from "./config-builder";
import type { ReelBuilding } from "../src/lib/config";

const buildings: ReelBuilding[] = [
  { slug: "a", name: "A", year: 1928, city: "Berlin", country: "Germany", countryCode: "DE", coordinates: { lng: 13, lat: 52 }, coverImage: "https://a", photoCount: 3 },
  { slug: "b", name: "B", year: 1958, city: "New York", country: "USA", countryCode: "US", coordinates: { lng: -74, lat: 40 }, coverImage: "https://b", photoCount: 5 },
];

describe("buildReelConfig", () => {
  it("preserves chronological order, computes stats, defaults hook to earliest", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings, episode: 4 });
    expect(cfg.buildings.map((b) => b.slug)).toEqual(["a", "b"]);
    expect(cfg.hookSlug).toBe("a");
    expect(cfg.stats.count).toBe(2);
    expect(cfg.episode).toBe(4);
  });

  it("honors an explicit hookSlug", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings, episode: 4, hookSlug: "b" });
    expect(cfg.hookSlug).toBe("b");
  });

  it("throws if fewer than 2 buildings", () => {
    expect(() => buildReelConfig({ slug: "x", architect: "X", buildings: [buildings[0]], episode: 1 })).toThrow();
  });
});

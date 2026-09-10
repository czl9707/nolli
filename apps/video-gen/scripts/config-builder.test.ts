import { describe, it, expect } from "vitest";
import { buildReelConfig } from "./config-builder";
import { yearRange } from "@/lib/config";
import type { ReelBuilding } from "@/lib/config";

const buildings: ReelBuilding[] = [
  { slug: "a", name: "A", year: 1958, city: "New York", countryCode: "US", coordinates: { lng: -74, lat: 40 }, coverImage: "https://a" },
  { slug: "b", name: "B", year: 1928, city: "Berlin", countryCode: "DE", coordinates: { lng: 13, lat: 52 }, coverImage: "https://b" },
];

describe("buildReelConfig", () => {
  it("starts at the earliest work and alternates geography", () => {
    // Two Berlin works clustered + two distant (NY, Tokyo): the walk must
    // never place the two cluster works in a row. b(1928, Berlin) starts,
    // farthest-from-recent picks alternate continents, the second Berlin
    // work lands between distant ones.
    const spread: ReelBuilding[] = [
      { slug: "a", name: "A", year: 1958, city: "New York", countryCode: "US", coordinates: { lng: -74, lat: 40 }, coverImage: "https://a" },
      { slug: "b", name: "B", year: 1928, city: "Berlin", countryCode: "DE", coordinates: { lng: 13, lat: 52 }, coverImage: "https://b" },
      { slug: "c", name: "C", year: 1930, city: "Berlin", countryCode: "DE", coordinates: { lng: 13.1, lat: 52.1 }, coverImage: "https://c" },
      { slug: "e", name: "E", year: 1960, city: "Tokyo", countryCode: "JP", coordinates: { lng: 139, lat: 35 }, coverImage: "https://e" },
    ];
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings: spread });
    const order = cfg.buildings.map((b) => b.slug);
    expect(order[0]).toBe("b");
    const berlin = (s: string) => s === "b" || s === "c";
    const firstBerlin = order.indexOf("b");
    const secondBerlin = order.indexOf("c");
    expect(Math.abs(secondBerlin - firstBerlin)).toBeGreaterThanOrEqual(2);
  });

  it("two buildings: earliest first", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings });
    expect(cfg.buildings.map((b) => b.slug)).toEqual(["b", "a"]);
  });

  it("throws if fewer than 2 buildings", () => {
    expect(() => buildReelConfig({ slug: "x", architect: "X", buildings: [buildings[0]] })).toThrow();
  });

  it("derives the year range", () => {
    const cfg = buildReelConfig({ slug: "mies", architect: "Mies", buildings });
    expect(yearRange(cfg)).toBe("1928–1958");
  });
});

import { describe, it, expect } from "vitest";
import { computeStats } from "./stats";
import type { ReelBuilding } from "./config";

const b = (year: number, country: string): ReelBuilding =>
  ({ slug: "x", name: "X", year, city: "c", country, countryCode: "", coordinates: { lng: 0, lat: 0 }, coverImage: "", photoCount: 1 });

describe("computeStats", () => {
  it("counts buildings, distinct countries, and year span", () => {
    const s = computeStats([b(1928, "Germany"), b(1929, "Spain"), b(1958, "USA")]);
    expect(s.count).toBe(3);
    expect(s.countries).toBe(3);
    expect(s.fromYear).toBe(1928);
    expect(s.toYear).toBe(1958);
  });

  it("dedupes countries", () => {
    const s = computeStats([b(1928, "Germany"), b(1930, "Germany"), b(1958, "USA")]);
    expect(s.countries).toBe(2);
  });

  it("formats the data line", () => {
    const s = computeStats([b(1928, "Germany"), b(1986, "USA")]);
    expect(s.line).toBe("2 buildings · 2 countries · 1928–1986");
  });

  it("handles a single building", () => {
    const s = computeStats([b(1928, "Germany")]);
    expect(s.count).toBe(1);
    expect(s.line).toBe("1 building · 1 country · 1928");
  });
});

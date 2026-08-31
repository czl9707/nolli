import { describe, expect, it } from "vitest";
import { rowsToManifest, type BuildingRow } from "./manifest";

describe("rowsToManifest", () => {
  const rows: BuildingRow[] = [
    { slug: "rolex-learning-center", name: "Rolex Learning Center", year: 2010, city: "Lausanne", cc: "CH", latitude: 46.5197, longitude: 6.5668 },
    { slug: "louvre-lens", name: "Louvre-Lens", year: 2012, city: "Lens", cc: "FR", latitude: 50.4333, longitude: 2.8333 },
  ];

  it("maps rows to a manifest with the buildings", () => {
    const m = rowsToManifest(rows, { architect: "SANAA", slug: "sanaa" });
    expect(m.architect).toBe("SANAA");
    expect(m.slug).toBe("sanaa");
    expect(m.buildings).toHaveLength(2);
    expect(m.buildings[0]).toEqual(rows[0]);
  });
});

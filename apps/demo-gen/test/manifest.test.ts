import { describe, expect, it } from "vitest";
import { rowsToManifest, type BuildingRow } from "../scripts/manifest";

describe("rowsToManifest", () => {
  const rows: BuildingRow[] = [
    { slug: "rolex-learning-center", name: "Rolex Learning Center", year: 2010, city: "Lausanne", cc: "CH", latitude: 46.5197, longitude: 6.5668 },
    { slug: "louvre-lens", name: "Louvre-Lens", year: 2012, city: "Lens", cc: "FR", latitude: 50.4333, longitude: 2.8333 },
  ];

  it("maps rows to a manifest with count and an explicit hero", () => {
    const m = rowsToManifest(rows, { architect: "SANAA", slug: "sanaa", heroSlug: "rolex-learning-center" });
    expect(m.architect).toBe("SANAA");
    expect(m.slug).toBe("sanaa");
    expect(m.count).toBe(2);
    expect(m.buildings).toHaveLength(2);
    expect(m.buildings[0]).toEqual(rows[0]);
    expect(m.hero).toBe("rolex-learning-center");
  });

  it("falls back to the first building when hero slug is absent", () => {
    const m = rowsToManifest(rows, { architect: "SANAA", slug: "sanaa" });
    expect(m.hero).toBe("rolex-learning-center");
  });
});

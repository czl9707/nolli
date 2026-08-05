export type BuildingRow = {
  slug: string;
  name: string;
  year: number;
  city: string;
  cc: string;
  latitude: number;
  longitude: number;
};

export type Manifest = {
  architect: string;
  slug: string;
  count: number;
  hero: string;
  buildings: BuildingRow[];
};

export function rowsToManifest(
  rows: BuildingRow[],
  opts: { architect: string; slug: string; heroSlug?: string },
): Manifest {
  const hero = opts.heroSlug ?? rows[0]?.slug ?? "";
  return {
    architect: opts.architect,
    slug: opts.slug,
    count: rows.length,
    hero,
    buildings: rows,
  };
}

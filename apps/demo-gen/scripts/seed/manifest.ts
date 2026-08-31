export type BuildingRow = {
  slug: string;
  name: string;
  year: number;
  city: string;
  cc: string;
  latitude: number;
  longitude: number;
};

// Buildings are year-ascending (from the DB query), so buildings[0] is the
// architect's earliest work — the default the seeded journey opens on.
export type Manifest = {
  architect: string;
  slug: string;
  buildings: BuildingRow[];
};

export function rowsToManifest(
  rows: BuildingRow[],
  opts: { architect: string; slug: string },
): Manifest {
  return {
    architect: opts.architect,
    slug: opts.slug,
    buildings: rows,
  };
}

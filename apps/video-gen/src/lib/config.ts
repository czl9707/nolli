export type Coordinates = { lng: number; lat: number };

export type ReelBuilding = {
  slug: string;
  name: string;
  year: number;
  city: string;
  countryCode: string;
  coordinates: Coordinates;
  coverImage: string;
};

export type ReelConfig = {
  slug: string;
  architect: string;
  /** One dry line from or about the architect — the poster's caption.
   *  Set by hand in reel.json; absent = no quote block. */
  quote?: string;
  buildings: ReelBuilding[];
};

/** Depends on buildings being chronologically sorted (buildReelConfig sorts). */
export const yearRange = (cfg: ReelConfig): string => {
  const years = cfg.buildings.map((b) => b.year);
  return `${Math.min(...years)}–${Math.max(...years)}`;
};

/** Staged hero image URL for a building (written by scripts/assets.ts). */
export const heroImagePath = (slug: string, buildingSlug: string): string =>
  `data/${slug}/images/${buildingSlug}-hero.jpg`;

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
  buildings: ReelBuilding[];
};

/** The reel's year range, from its (already chronologically sorted) buildings. */
export const yearRange = (cfg: ReelConfig): string => {
  const years = cfg.buildings.map((b) => b.year);
  return `${Math.min(...years)}–${Math.max(...years)}`;
};

export const titleLead = "Architectures by";
export const hookLead = "Architecture by";
export const mapTail = "On a Map";

/** Staged hero image URL for a building (written by scripts/assets.ts). */
export const heroImagePath = (slug: string, buildingSlug: string): string =>
  `data/${slug}/images/${buildingSlug}-hero.jpg`;

/** The persistent WALK title: lead + name on line 1, map tail on line 2. */
export const reelTitleLines = (cfg: ReelConfig): [string, string] => [
  `${titleLead} ${cfg.architect},`,
  mapTail,
];

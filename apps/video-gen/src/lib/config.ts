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

/** The reel's narrative frame — the architect's oeuvre pinned to the product.
 *  Template needs only the architect's name. */
export const mapTail = "on a Map.";

/** The persistent WALK title: name + map tail. */
export const reelTitle = (cfg: ReelConfig): string => `${cfg.architect} ${mapTail}`;

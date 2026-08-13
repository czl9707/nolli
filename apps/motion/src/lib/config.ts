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

/** The reel's descriptive title — the architect's body of work framed across
 *  time. A pure template over the architect name (no per-architect copywriting)
 *  so the seed can generate it without a config field. Used by the Hook title
 *  and the WALK corner brand. */
export const reelTitle = (architect: string): string => `${architect} over time`;

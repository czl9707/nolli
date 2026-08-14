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

/** The reel's descriptive title — a pure template so the seed can generate it
 *  without a per-architect config field. */
export const reelTitle = (architect: string): string => `${architect} over time`;

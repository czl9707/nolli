export type Coordinates = { lng: number; lat: number };

export type ReelBuilding = {
  slug: string;
  name: string;
  year: number;
  city: string;
  country: string;
  countryCode: string;
  coordinates: Coordinates;
  coverImage: string;
  photoCount: number;
};

export type ReelConfig = {
  slug: string;
  architect: string;
  episode: number;
  hookSlug: string;
  buildings: ReelBuilding[];
  stats: { count: number; countries: number; fromYear: number; toYear: number; line: string };
};

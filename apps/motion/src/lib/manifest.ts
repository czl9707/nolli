export type Building = {
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
  buildings: Building[];
  stills?: { path: string }[];
  mapClip?: string;
  mapClipEnd?: string;
};

// The manifest is no longer statically imported — it is generated into
// out/<slug>/manifest.json and fed to the render via inputProps (see
// scripts/assemble.ts). This module keeps only the shared types.

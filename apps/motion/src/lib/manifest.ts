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

// Remotion cannot fetch() during render, so bundle the manifest JSON at build time.
import sanaaManifest from "../../public/capture/sanaa/manifest.json";

const MAP: Record<string, Manifest> = {
  sanaa: sanaaManifest as unknown as Manifest,
};

export function importManifest(slug: string): Manifest {
  const m = MAP[slug];
  if (!m) throw new Error(`No bundled manifest for "${slug}".`);
  return m;
}

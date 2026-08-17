import type { ReelBuilding, ReelConfig } from "../src/lib/config";

export type BuildReelConfigArgs = {
  slug: string;
  architect: string;
  buildings: ReelBuilding[];
};

export function buildReelConfig(args: BuildReelConfigArgs): ReelConfig {
  if (args.buildings.length < 2) {
    throw new Error(`Reel needs >=2 buildings; got ${args.buildings.length}.`);
  }
  const buildings = [...args.buildings].sort((a, b) => a.year - b.year);
  return { slug: args.slug, architect: args.architect, buildings };
}

import type { ReelBuilding, ReelConfig } from "../src/lib/config";
import { computeStats } from "../src/lib/stats";

export type BuildReelConfigArgs = {
  slug: string;
  architect: string;
  buildings: ReelBuilding[];
  episode: number;
  hookSlug?: string;
};

export function buildReelConfig(args: BuildReelConfigArgs): ReelConfig {
  if (args.buildings.length < 2) {
    throw new Error(`Reel needs >=2 buildings; got ${args.buildings.length}.`);
  }
  const buildings = [...args.buildings].sort((a, b) => a.year - b.year);
  const stats = computeStats(buildings);
  const hookSlug = args.hookSlug ?? buildings[0].slug;
  return { slug: args.slug, architect: args.architect, episode: args.episode, hookSlug, buildings, stats };
}

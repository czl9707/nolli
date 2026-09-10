import { haversine } from "@/lib/viewport";
import type { ReelBuilding, ReelConfig } from "@/lib/config";

export type BuildReelConfigArgs = {
  slug: string;
  architect: string;
  buildings: ReelBuilding[];
};

/** Deterministic walk order: start at the earliest work, then repeatedly pick
 *  the remaining building farthest from the last two shown (ties → earlier
 *  year), so geo-clustered works alternate across the map instead of running
 *  in a row. */
function spreadOrder(sorted: ReelBuilding[]): ReelBuilding[] {
  const pool = [...sorted];
  const out: ReelBuilding[] = [pool.shift()!];
  while (pool.length > 0) {
    let best = 0;
    let bestScore = -1;
    pool.forEach((b, j) => {
      const recent = out.slice(-2);
      const score = Math.min(...recent.map((r) => haversine(r.coordinates, b.coordinates)));
      if (score > bestScore || (score === bestScore && b.year < pool[best].year)) {
        best = j;
        bestScore = score;
      }
    });
    out.push(pool.splice(best, 1)[0]);
  }
  return out;
}

export function buildReelConfig(args: BuildReelConfigArgs): ReelConfig {
  if (args.buildings.length < 2) {
    throw new Error(`Reel needs >=2 buildings; got ${args.buildings.length}.`);
  }
  const sorted = [...args.buildings].sort((a, b) => a.year - b.year);
  return { slug: args.slug, architect: args.architect, buildings: spreadOrder(sorted) };
}

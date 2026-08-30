import { existsSync, readFileSync } from "node:fs";
import type { ReelConfig } from "../src/lib/config";
import { reelConfigPath } from "./paths";

/** Throws one canonical "Run seed first" message if missing or malformed. */
export function loadReelConfig(slug: string): ReelConfig {
  const path = reelConfigPath(slug);
  if (!existsSync(path)) throw new Error(`No reel.json at ${path}. Run seed first.`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ReelConfig;
  } catch {
    throw new Error(`Malformed reel.json at ${path}. Re-run seed.`);
  }
}

export function reelConfigExists(slug: string): boolean {
  const path = reelConfigPath(slug);
  if (!existsSync(path)) return false;
  try {
    JSON.parse(readFileSync(path, "utf8"));
    return true;
  } catch {
    return false;
  }
}

import { existsSync, readFileSync } from "node:fs";
import { readJsonOr } from "@nolli/remotion/cli";
import type { ReelConfig } from "../src/lib/config";
import { reelConfigPath } from "./paths";

/** Throws one canonical "Run seed first" message if missing or malformed. */
export function loadReelConfig(slug: string): ReelConfig {
  return readJsonOr<ReelConfig>(reelConfigPath(slug), "Run seed first.");
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

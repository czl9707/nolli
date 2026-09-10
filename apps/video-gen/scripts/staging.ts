import { readJsonOr } from "@nolli/remotion/cli";
import type { ReelConfig } from "@/lib/config";
import { reelConfigPath } from "./paths";

/** Throws one canonical "Run seed first" message if missing or malformed. */
export function loadReelConfig(slug: string): ReelConfig {
  return readJsonOr<ReelConfig>(reelConfigPath(slug), "Run seed first.");
}

import { useStaticJson } from "./use-static-json";
import type { ReelConfig } from "./config";

export function useReelConfig(slug: string): ReelConfig | null {
  return useStaticJson<ReelConfig>(`capture/${slug}/reel.json`, "load reel.json");
}

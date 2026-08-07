import { useState, useEffect } from "react";
import { staticFile, delayRender, continueRender } from "remotion";
import type { ReelConfig } from "./config";

export function useReelConfig(slug: string): ReelConfig | null {
  const [cfg, setCfg] = useState<ReelConfig | null>(null);
  useEffect(() => {
    const handle = delayRender("load reel.json");
    fetch(staticFile(`capture/${slug}/reel.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`reel.json fetch ${r.status}`);
        return r.json() as Promise<ReelConfig>;
      })
      .then((c) => {
        setCfg(c);
        continueRender(handle);
      })
      .catch((e) => {
        console.error("reel.json load failed:", e);
        continueRender(handle);
      });
  }, [slug]);
  return cfg;
}

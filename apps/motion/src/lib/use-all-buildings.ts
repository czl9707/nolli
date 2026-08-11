import { useState, useEffect } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

/** Minimal building shape from the seed-generated `all-buildings.json` (every
 *  building in the DB). Used to scatter the full Nolli-world pin field on the
 *  HOOK map before the reel focuses on one architect. The map reads only
 *  coordinates/slug/name, so this is all we need. */
export type AllBuilding = {
  id: number;
  slug: string;
  name: string;
  coordinates: { lng: number; lat: number };
};

/** Load the global building list (architect-agnostic) staged at
 *  `public/capture/all-buildings.json` by render.ts. Mirrors useReelConfig's
 *  delayRender pattern so a frame never renders before the HOOK pin field
 *  resolves. Returns null until loaded (or if the file is missing — HOOK then
 *  falls back to no pins). */
export function useAllBuildings(): AllBuilding[] | null {
  const [all, setAll] = useState<AllBuilding[] | null>(null);
  useEffect(() => {
    const handle = delayRender("load all-buildings.json");
    fetch(staticFile("capture/all-buildings.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`all-buildings.json fetch ${r.status}`);
        return r.json() as Promise<AllBuilding[]>;
      })
      .then((b) => {
        setAll(b);
        continueRender(handle);
      })
      .catch((e) => {
        console.error("all-buildings.json load failed:", e);
        continueRender(handle);
      });
  }, []);
  return all;
}

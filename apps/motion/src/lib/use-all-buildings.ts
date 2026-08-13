import { useStaticJson } from "./use-static-json";

/** Minimal building shape from the seed-generated `all-buildings.json` (every
 *  building in the DB), used to scatter the full pin field on the HOOK map. */
export type AllBuilding = {
  id: number;
  slug: string;
  name: string;
  coordinates: { lng: number; lat: number };
};

export function useAllBuildings(): AllBuilding[] | null {
  return useStaticJson<AllBuilding[]>("capture/all-buildings.json", "load all-buildings.json");
}

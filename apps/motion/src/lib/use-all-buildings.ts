import { useEffect, useState } from "react";
import { staticFile, delayRender, continueRender } from "remotion";
import type { ArchSummary } from "@nolli/data";

type AllBuildingRow = {
  id: number;
  slug: string;
  name: string;
  coordinates: { lng: number; lat: number };
};

export function useAllBuildings(): ArchSummary[] | null {
  const [data, setData] = useState<ArchSummary[] | null>(null);
  useEffect(() => {
    const handle = delayRender("load all-buildings");
    fetch(staticFile("capture/all-buildings.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`all-buildings ${r.status}`);
        return r.json() as Promise<AllBuildingRow[]>;
      })
      .then((rows) => {
        setData(
          rows.map((r) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            architect: "",
            year: 0,
            coordinates: r.coordinates,
            cover: { image: "", width: 0, height: 0 },
          })),
        );
        continueRender(handle);
      })
      .catch((e) => {
        console.error("all-buildings load failed:", e);
        continueRender(handle);
      });
  }, []);
  return data;
}

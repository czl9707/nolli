import { useEffect } from "react";
import { delayRender, continueRender } from "remotion";
import type { MapRef } from "@nolli/map";
import type { MapViewport } from "./viewport";

export function useMapCamera(
  map: MapRef | null,
  viewport: MapViewport,
  frame: number,
): void {
  useEffect(() => {
    if (!map || map.loaded()) return;
    const handle = delayRender("archmap-load");
    let done = false;
    const release = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    const onIdle = () => {
      if (map.loaded()) release();
    };
    map.once("idle", onIdle);
    return () => {
      map.off("idle", onIdle);
      release();
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const handle = delayRender(`archmap frame ${frame}`);
    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      continueRender(handle);
    };
    map.jumpTo({ center: viewport.center, zoom: viewport.zoom });
    map.once("idle", release);
    return () => {
      map.off("idle", release);
      release();
    };
  }, [map, viewport.center[0], viewport.center[1], viewport.zoom, frame]);
}

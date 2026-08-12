import { useContext, useEffect } from "react";
import { MapContext } from "./MapProvider";
import { useMapFrame } from "../lib/use-map-frame";
import type { MapViewport } from "../lib/viewport";

/**
 * Static camera segment: holds `at` and gates the frame's screenshot release on
 * tile-readiness (moving=false → strict gate, no sharpen-in flicker on a held
 * building). Publishes `selectedSlug` to the map via context (from a useEffect,
 * per the MapSegmentState contract — never during render). Tiny body — no easing.
 */
export const Hold: React.FC<{
  at: MapViewport;
  selectedSlug?: string;
}> = ({ at, selectedSlug }) => {
  const ctx = useContext(MapContext);
  const setSegmentState = ctx?.setSegmentState;
  useEffect(() => {
    if (setSegmentState) setSegmentState({ selectedSlug });
  }, [selectedSlug, setSegmentState]);
  useMapFrame(ctx?.map ?? null, at, false);
  return null;
};

import { useMapContext, useSelectedSlug } from "./MapProvider";
import { useMapFrame } from "../lib/use-map-frame";
import type { MapViewport } from "../lib/viewport";

export const Hold: React.FC<{
  at: MapViewport;
  selectedSlug?: string;
}> = ({ at, selectedSlug }) => {
  const { map } = useMapContext();
  useSelectedSlug(selectedSlug);
  useMapFrame(map, at, false);
  return null;
};

// apps/video-gen/src/ReelComposition.tsx
import { AbsoluteFill, Sequence } from "remotion";
import { useStaticJson } from "./lib/use-static-json";
import { useFontsReady } from "@nolli/remotion";
import { END_FRAMES, endStart } from "./lib/timeline";
import type { ReelConfig } from "./lib/config";
import type { WalkVariant } from "./lib/variant";
import { GridPoster } from "./components/grid/GridPoster";
import { EndLockup } from "./components/EndLockup";

export const ReelComposition: React.FC<{ slug: string; variant?: WalkVariant }> = ({ slug, variant = "grid" }) => {
  useFontsReady();
  const cfg = useStaticJson<ReelConfig>(`data/${slug}/reel.json`, "load reel.json");
  if (!cfg) return null;
  const buildings = cfg.buildings;
  const count = buildings.length;
  return (
    <AbsoluteFill data-theme="light" style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      <GridPoster cfg={cfg} buildings={buildings} />
      <Sequence from={endStart(count)} durationInFrames={END_FRAMES} layout="none">
        <EndLockup />
      </Sequence>
    </AbsoluteFill>
  );
};

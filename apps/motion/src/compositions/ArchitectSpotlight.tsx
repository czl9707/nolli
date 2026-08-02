import { Series } from "remotion";
import { Scene1Stills } from "../scenes/Scene1Stills";
import { Scene2MapMorph } from "../scenes/Scene2MapMorph";
import { OutroSeries } from "../scenes/OutroSegments";
import type { Manifest } from "../lib/manifest";
import { scene1Duration, scene2Duration, scene3Duration } from "../lib/timing";

export type SpotlightProps = {
  manifest: Manifest;
  fontVariant: "inter" | "playful";
};

export const ArchitectSpotlight: React.FC<SpotlightProps> = ({ manifest, fontVariant }) => {
  const stillCount = manifest.stills?.length ?? 0;
  const hasMorph = Boolean(manifest.mapClip);
  return (
    <Series>
      {stillCount > 0 && (
        <Series.Sequence durationInFrames={scene1Duration(stillCount)}>
          <Scene1Stills manifest={manifest} />
        </Series.Sequence>
      )}
      {hasMorph && (
        <Series.Sequence durationInFrames={scene2Duration}>
          <Scene2MapMorph manifest={manifest} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={scene3Duration(manifest)}>
        <OutroSeries manifest={manifest} fontVariant={fontVariant} />
      </Series.Sequence>
    </Series>
  );
};

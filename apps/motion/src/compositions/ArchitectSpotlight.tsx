import { Series } from "remotion";
import { Scene1Stills } from "../scenes/Scene1Stills";
import { Scene2MapMorph } from "../scenes/Scene2MapMorph";
import { Scene3Count } from "../scenes/Scene3Count";
import { importManifest } from "../lib/manifest";
import { scene1Duration, scene2Duration, scene3Duration, totalDuration } from "../lib/timing";

export type SpotlightProps = {
  architectSlug: string;
  fontVariant: "inter" | "playful";
};

export const ArchitectSpotlight: React.FC<SpotlightProps> = ({ architectSlug, fontVariant }) => {
  const manifest = importManifest(architectSlug);
  const stillCount = manifest.stills?.length ?? 0;
  // Series.Sequence requires a positive durationInFrames, so skip Scene 1
  // entirely when the manifest has no captured stills yet (pre-capture state).
  return (
    <Series>
      {stillCount > 0 && (
        <Series.Sequence durationInFrames={scene1Duration(stillCount)}>
          <Scene1Stills manifest={manifest} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={scene2Duration}>
        <Scene2MapMorph manifest={manifest} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={scene3Duration}>
        <Scene3Count manifest={manifest} variant={fontVariant} />
      </Series.Sequence>
    </Series>
  );
};

export const spotlightDuration = (slug: string) => {
  const m = importManifest(slug);
  return totalDuration(m.stills?.length ?? 0);
};

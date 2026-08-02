import { Composition } from "remotion";
import { ArchitectSpotlight, type SpotlightProps } from "./compositions/ArchitectSpotlight";
import { Scene3Count, type TextVariant } from "./scenes/Scene3Count";
import type { Manifest } from "./lib/manifest";
import { FPS, STILL_FRAMES, scene2Duration, scene3Duration } from "./lib/timing";

// Placeholder manifest so Remotion Studio renders without --props. Real renders
// always go through `assemble`, which passes the curated manifest via inputProps.
const placeholderManifest: Manifest = {
  architect: "",
  slug: "",
  count: 0,
  hero: "",
  buildings: [],
};

const defaultProps: SpotlightProps = {
  manifest: placeholderManifest,
  fontVariant: "playful",
  textVariant: "line-wipe",
};

// Standalone Scene 3 only — cheap to render so text-animation variants can be
// A/B compared without rendering the full video.
const Scene3Text: React.FC<SpotlightProps> = ({ manifest, fontVariant, textVariant }) => (
  <Scene3Count manifest={manifest} fontVariant={fontVariant} variant={textVariant as TextVariant} />
);

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ArchitectSpotlight"
        component={ArchitectSpotlight}
        durationInFrames={300}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const m = props.manifest;
          const stillCount = m.stills?.length ?? 0;
          const total = stillCount * STILL_FRAMES + (m.mapClip ? scene2Duration : 0) + scene3Duration;
          return { durationInFrames: total, props };
        }}
      />
      <Composition
        id="Scene3Text"
        component={Scene3Text}
        durationInFrames={scene3Duration}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};

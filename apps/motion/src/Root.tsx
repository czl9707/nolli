import { Composition } from "remotion";
import { ArchitectSpotlight, type SpotlightProps } from "./compositions/ArchitectSpotlight";
import { importManifest } from "./lib/manifest";
import { FPS, STILL_FRAMES, scene2Duration, scene3Duration } from "./lib/timing";

const defaultProps: SpotlightProps = { architectSlug: "sanaa", fontVariant: "inter" };

export const RemotionRoot = () => {
  return (
    <Composition
      id="ArchitectSpotlight"
      component={ArchitectSpotlight}
      durationInFrames={300}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const m = importManifest(props.architectSlug);
        const stillCount = m.stills?.length ?? 0;
        const total = stillCount * STILL_FRAMES + scene2Duration + scene3Duration;
        return { durationInFrames: total, props };
      }}
    />
  );
};

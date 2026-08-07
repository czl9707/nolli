import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { SpikeMap } from "./SpikeMap";
import { ReelMapPanTest } from "./ReelMapPanTest";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="reel"
        component={ReelComposition}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ slug: "sanaa" }}
      />
      <Composition
        id="spike-map"
        component={SpikeMap}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="reel-map-pan"
        component={ReelMapPanTest}
        durationInFrames={4}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

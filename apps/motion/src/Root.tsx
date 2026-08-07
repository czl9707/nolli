import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { SpikeMap } from "./SpikeMap";

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
    </>
  );
};

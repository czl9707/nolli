import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { FPS, totalFrames } from "./lib/timeline";

const SANAA_COUNT = 9; // buildings in the sanaa episode; reel length scales with this.

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="reel"
      component={ReelComposition}
      durationInFrames={totalFrames(SANAA_COUNT)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ slug: "sanaa" }}
    />
  );
};

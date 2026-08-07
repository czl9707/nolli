import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="reel"
      component={ReelComposition}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

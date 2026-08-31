import { Composition } from "remotion";
import { DemoComposition } from "./DemoComposition";
import { FPS } from "./lib/constants";
import { totalDuration, DEFAULT_FONT_VARIANT, type VideoConfig } from "./lib/scenes";

// Placeholder config so Remotion Studio renders without --props. Real renders
// always go through `assemble`, which passes the curated VideoConfig.
const placeholderConfig: VideoConfig = { slug: "", fontVariant: DEFAULT_FONT_VARIANT, scenes: [] };

export const RemotionRoot = () => {
  return (
    <Composition
      id="DemoComposition"
      component={DemoComposition}
      durationInFrames={300}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ config: placeholderConfig }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(1, totalDuration(props.config.scenes)),
        props,
      })}
    />
  );
};

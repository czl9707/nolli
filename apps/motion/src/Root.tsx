import { Composition } from "remotion";
import { ArchitectSpotlight } from "./compositions/ArchitectSpotlight";
import { SegmentText, SegmentLogo } from "./scenes/OutroSegments";
import { FPS } from "./lib/timing";
import { durationOf, totalDuration, type VideoConfig, type TextScene, type FontVariant } from "./lib/scenes";

// Placeholder config so Remotion Studio renders without --props. Real renders
// always go through `assemble`, which passes the curated VideoConfig.
const placeholderConfig: VideoConfig = { slug: "", fontVariant: "playful", scenes: [] };

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
        defaultProps={{ config: placeholderConfig }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(1, totalDuration(props.config.scenes)),
          props,
        })}
      />
      <Composition
        id="OutroText"
        component={SegmentText}
        durationInFrames={60}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          scene: { type: "text", text: "Name" } as TextScene,
          fontVariant: "playful" as FontVariant,
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: durationOf(props.scene), props })}
      />
      <Composition
        id="OutroLogo"
        component={SegmentLogo}
        durationInFrames={60}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ fontVariant: "playful" as FontVariant }}
        calculateMetadata={({ props }) => ({ durationInFrames: durationOf({ type: "logo" }), props })}
      />
    </>
  );
};

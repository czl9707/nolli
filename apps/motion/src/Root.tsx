import { Composition } from "remotion";
import { ArchitectSpotlight, type SpotlightProps } from "./compositions/ArchitectSpotlight";
import { SegmentName, SegmentCount, SegmentNow, SegmentLogo } from "./scenes/OutroSegments";
import type { Manifest } from "./lib/manifest";
import { FPS, STILL_FRAMES, scene2Duration, scene3Duration } from "./lib/timing";
import { outroSegmentDurations } from "./lib/outro";

// Placeholder manifest so Remotion Studio renders without --props. Real renders
// always go through `assemble`, which passes the curated manifest via inputProps.
const placeholderManifest: Manifest = {
  architect: "",
  slug: "",
  count: 0,
  hero: "",
  buildings: [],
  stills: [],
};

const defaultProps: SpotlightProps = {
  manifest: placeholderManifest,
  fontVariant: "playful",
};

// Standalone outro segments — cheap to render separately so clips can be
// interleaved with other material later. assets:outro renders all four.
const outroSegmentProps = { manifest: placeholderManifest, fontVariant: "playful" as const };

// Static durations for Studio (placeholder content); calculateMetadata overrides
// with the real manifest's text lengths on actual renders.
const placeholderSeg = outroSegmentDurations(placeholderManifest);

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
          const total = stillCount * STILL_FRAMES + (m.mapClip ? scene2Duration : 0) + scene3Duration(m);
          return { durationInFrames: total, props };
        }}
      />
      <Composition
        id="OutroName"
        component={SegmentName}
        durationInFrames={placeholderSeg.name}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={outroSegmentProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: outroSegmentDurations(props.manifest).name,
          props,
        })}
      />
      <Composition
        id="OutroCount"
        component={SegmentCount}
        durationInFrames={placeholderSeg.count}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={outroSegmentProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: outroSegmentDurations(props.manifest).count,
          props,
        })}
      />
      <Composition
        id="OutroNow"
        component={SegmentNow}
        durationInFrames={placeholderSeg.now}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={outroSegmentProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: outroSegmentDurations(props.manifest).now,
          props,
        })}
      />
      <Composition
        id="OutroLogo"
        component={SegmentLogo}
        durationInFrames={placeholderSeg.logo}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={outroSegmentProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: outroSegmentDurations(props.manifest).logo,
          props,
        })}
      />
    </>
  );
};

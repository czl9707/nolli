import { Series } from "remotion";
import { Scene1Stills } from "../scenes/Scene1Stills";
import { Scene2MapMorph } from "../scenes/Scene2MapMorph";
import { SegmentName, SegmentCount, SegmentNow, SegmentLogo } from "../scenes/OutroSegments";
import type { Manifest } from "../lib/manifest";
import { STILL_FRAMES, scene2Duration } from "../lib/timing";
import { outroSegmentDurations } from "../lib/outro";

export type SpotlightProps = {
  manifest: Manifest;
  fontVariant: "inter" | "playful";
};

// Interleaved timeline: each text segment is separated by a content beat —
//   name → first half of stills → count → second half → now → morph → logo.
// Total length is unchanged from the contiguous layout; only the order shifts.
export const ArchitectSpotlight: React.FC<SpotlightProps> = ({ manifest, fontVariant }) => {
  const stills = manifest.stills ?? [];
  const hasMorph = Boolean(manifest.mapClip);
  const mid = Math.ceil(stills.length / 2);
  const firstHalf = stills.slice(0, mid);
  const secondHalf = stills.slice(mid);

  const seg = outroSegmentDurations(manifest);
  const segProps = { manifest, fontVariant };

  return (
    <Series>
      <Series.Sequence durationInFrames={seg.name}>
        <SegmentName {...segProps} />
      </Series.Sequence>
      {firstHalf.length > 0 && (
        <Series.Sequence durationInFrames={firstHalf.length * STILL_FRAMES}>
          <Scene1Stills stills={firstHalf} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.count}>
        <SegmentCount {...segProps} />
      </Series.Sequence>
      {secondHalf.length > 0 && (
        <Series.Sequence durationInFrames={secondHalf.length * STILL_FRAMES}>
          <Scene1Stills stills={secondHalf} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.now}>
        <SegmentNow {...segProps} />
      </Series.Sequence>
      {hasMorph && (
        <Series.Sequence durationInFrames={scene2Duration}>
          <Scene2MapMorph manifest={manifest} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.logo}>
        <SegmentLogo {...segProps} />
      </Series.Sequence>
    </Series>
  );
};

import { Series } from "remotion";
import { Scene1Stills } from "../scenes/Scene1Stills";
import { Scene2MapMorph } from "../scenes/Scene2MapMorph";
import { SegmentName, SegmentCount, SegmentNow, SegmentLogo } from "../scenes/OutroSegments";
import type { Manifest } from "../lib/manifest";
import { STILL_FRAMES, scene2Frames } from "../lib/timing";
import { outroSegmentDurations } from "../lib/outro";

export type SpotlightProps = {
  manifest: Manifest;
  fontVariant: "inter" | "playful";
};

// Interleaved timeline: each text segment is separated by a content beat —
//   name → detail stills → count → board stills → now → morph → logo.
// The two still batches are explicit config (manifest.stills.detail / .board),
// staged from video.json by `assemble`.
export const ArchitectSpotlight: React.FC<SpotlightProps> = ({ manifest, fontVariant }) => {
  const detail = manifest.stills?.detail ?? [];
  const board = manifest.stills?.board ?? [];
  const hasMorph = Boolean(manifest.mapClip);

  const seg = outroSegmentDurations(manifest);
  const segProps = { manifest, fontVariant };

  return (
    <Series>
      <Series.Sequence durationInFrames={seg.name}>
        <SegmentName {...segProps} />
      </Series.Sequence>
      {detail.length > 0 && (
        <Series.Sequence durationInFrames={detail.length * STILL_FRAMES}>
          <Scene1Stills stills={detail} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.count}>
        <SegmentCount {...segProps} />
      </Series.Sequence>
      {board.length > 0 && (
        <Series.Sequence durationInFrames={board.length * STILL_FRAMES}>
          <Scene1Stills stills={board} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.now}>
        <SegmentNow {...segProps} />
      </Series.Sequence>
      {hasMorph && (
        <Series.Sequence durationInFrames={scene2Frames(manifest.mapClipFrames)}>
          <Scene2MapMorph manifest={manifest} />
        </Series.Sequence>
      )}
      <Series.Sequence durationInFrames={seg.logo}>
        <SegmentLogo {...segProps} />
      </Series.Sequence>
    </Series>
  );
};

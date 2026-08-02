import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { THEME } from "../lib/theme";
import type { Manifest } from "../lib/manifest";

export const Scene2MapMorph: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const clip = manifest.mapClip ? staticFile(manifest.mapClip) : null;
  const endStill = manifest.mapClipEnd ? staticFile(manifest.mapClipEnd) : null;

  // Last ~24 frames: crossfade from clip into the lock-frame still + slow push-in.
  const handoffStart = durationInFrames - 24;
  const stillOpacity = interpolate(frame, [handoffStart, durationInFrames], [0, 1], { extrapolateLeft: "clamp" });
  const pushIn = interpolate(frame, [handoffStart, durationInFrames], [1, 1.06], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      {clip && (
        <OffthreadVideo src={clip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {endStill && (
        <Img
          src={endStill}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: stillOpacity,
            transform: `scale(${pushIn})`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

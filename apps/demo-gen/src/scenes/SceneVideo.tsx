import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { VideoScene } from "../lib/scenes";

export const SceneVideo: React.FC<{ scene: VideoScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const endStill = scene.endStill ? staticFile(scene.endStill) : null;

  // Last ~24 frames: crossfade from clip into the lock-frame still + slow push-in.
  const handoffStart = Math.max(0, durationInFrames - 24);
  const stillOpacity = endStill
    ? interpolate(frame, [handoffStart, durationInFrames], [0, 1], { extrapolateLeft: "clamp" })
    : 0;
  const pushIn = endStill
    ? interpolate(frame, [handoffStart, durationInFrames], [1, 1.06], { extrapolateLeft: "clamp" })
    : 1;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(scene.src)}
        playbackRate={scene.playbackRate ?? 1}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
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

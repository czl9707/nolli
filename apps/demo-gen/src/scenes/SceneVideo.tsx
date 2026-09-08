import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import type { VideoScene } from "../lib/scenes";

export const SceneVideo: React.FC<{ scene: VideoScene }> = ({ scene }) => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile(scene.src)}
      playbackRate={scene.playbackRate ?? 1}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

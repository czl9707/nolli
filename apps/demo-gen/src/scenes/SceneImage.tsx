import { AbsoluteFill, Img, staticFile } from "remotion";
import type { ImageScene } from "../lib/scenes";

export const SceneImage: React.FC<{ scene: ImageScene }> = ({ scene }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Img
      src={staticFile(scene.src)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

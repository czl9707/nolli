import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { kenBurns } from "../lib/kenburns";
import { STILL_FRAMES } from "../lib/timing";
import type { ImageScene } from "../lib/scenes";

export const SceneImage: React.FC<{ scene: ImageScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const kb = kenBurns(frame, STILL_FRAMES);
  return (
    <AbsoluteFill style={{ opacity: kb.opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(scene.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${kb.scale}) translate(${kb.x}px, ${kb.y}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

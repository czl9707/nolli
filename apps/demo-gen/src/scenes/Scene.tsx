import { SegmentText, SegmentLogo } from "./OutroSegments";
import { SceneImage } from "./SceneImage";
import { SceneVideo } from "./SceneVideo";
import type { Scene, FontVariant } from "../lib/scenes";

// Named SceneRenderer to avoid clashing with the Scene type.
export const SceneRenderer: React.FC<{ scene: Scene; fontVariant: FontVariant }> = ({
  scene,
  fontVariant,
}) => {
  switch (scene.type) {
    case "text":
      return <SegmentText scene={scene} fontVariant={fontVariant} />;
    case "image":
      return <SceneImage scene={scene} />;
    case "video":
      return <SceneVideo scene={scene} />;
    case "logo":
      return <SegmentLogo fontVariant={fontVariant} />;
  }
};

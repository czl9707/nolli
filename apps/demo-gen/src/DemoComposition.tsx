import { AbsoluteFill, Series } from "remotion";
import { useFontsReady } from "@nolli/remotion";
import { SceneRenderer } from "./scenes/Scene";
import { BG } from "./lib/constants";
import { durationOf, DEFAULT_FONT_VARIANT, type VideoConfig } from "./lib/scenes";

// The dark tokens in @nolli/ui/global.css are scoped to body[data-theme='dark'];
// stamp it (plus the color-scheme flip, so headless Chrome's light default
// doesn't leak into any prefers-color-scheme CSS).
if (typeof document !== "undefined") {
  document.body.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
}

export type DemoCompositionProps = { config: VideoConfig };

// The timeline is data-driven — reorder/edits live in video.json, not here.
export const DemoComposition: React.FC<DemoCompositionProps> = ({ config }) => {
  useFontsReady();
  const fontVariant = config.fontVariant ?? DEFAULT_FONT_VARIANT;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Series>
        {config.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={durationOf(scene)}>
            <SceneRenderer scene={scene} fontVariant={fontVariant} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

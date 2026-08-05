import { AbsoluteFill, Series } from "remotion";
import { SceneRenderer } from "../scenes/Scene";
import { durationOf, type VideoConfig } from "../lib/scenes";
import { THEME } from "../lib/theme";

export type SpotlightProps = { config: VideoConfig };

// The whole timeline is data-driven: each entry in config.scenes becomes a
// Series.Sequence whose length is derived from its type. Reorder/edits live in
// video.json, not here.
export const ArchitectSpotlight: React.FC<SpotlightProps> = ({ config }) => {
  const fontVariant = config.fontVariant ?? "playful";
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
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

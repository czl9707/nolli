// apps/video-gen/src/ReelComposition.tsx
import { AbsoluteFill, Sequence } from "remotion";
import { useStaticJson } from "./lib/use-static-json";
import { useFontsReady } from "@nolli/remotion";
import { END_FRAMES, endStart } from "./lib/timeline";
import type { ReelConfig } from "./lib/config";
import type { WalkVariant } from "./lib/variant";
import type { ReelTheme } from "./lib/theme";
import { GridPoster } from "./components/grid/GridPoster";
import { EndLockup } from "./components/EndLockup";
import { useThemePin } from "./lib/use-theme-pin";

export const ReelComposition: React.FC<{ slug: string; variant?: WalkVariant; theme?: ReelTheme }> = ({
  slug,
  variant = "grid",
  theme = "light",
}) => {
  useFontsReady();
  // Pin the ui theme store + browser color-scheme before any child mounts, so
  // theme-conditional SVGs and the map's pattern set resolve in the reel's
  // theme regardless of the headless Chrome default. (Was a module-load pin
  // in MapProvider; moved here when the theme became a prop.)
  useThemePin(theme);
  const cfg = useStaticJson<ReelConfig>(`data/${slug}/reel.json`, "load reel.json");
  if (!cfg) return null;
  const buildings = cfg.buildings;
  const count = buildings.length;
  return (
    <AbsoluteFill data-theme={theme} style={{ backgroundColor: "rgb(var(--color-primary-background))" }}>
      <GridPoster cfg={cfg} buildings={buildings} />
      <Sequence from={endStart(count)} durationInFrames={END_FRAMES} layout="none">
        <EndLockup />
      </Sequence>
    </AbsoluteFill>
  );
};

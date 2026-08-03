import { AbsoluteFill, Img, Series, staticFile, useCurrentFrame } from "remotion";
import { kenBurns } from "../lib/kenburns";
import { STILL_FRAMES } from "../lib/timing";
import { THEME } from "../lib/theme";

const Still: React.FC<{ path: string }> = ({ path }) => {
  const frame = useCurrentFrame();
  const kb = kenBurns(frame, STILL_FRAMES);
  return (
    <AbsoluteFill style={{ opacity: kb.opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(path)}
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

export const Scene1Stills: React.FC<{ stills: { path: string }[] }> = ({ stills }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
      <Series>
        {stills.map((s, i) => (
          <Series.Sequence key={s.path + i} durationInFrames={STILL_FRAMES}>
            <Still path={s.path} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

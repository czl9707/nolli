import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PLAYFUL_FAMILY, INTER_FAMILY } from "../fonts";
import { THEME } from "../lib/theme";
import type { Manifest } from "../lib/manifest";

export type TextVariant = "line-wipe" | "kinetic" | "minimal";

type Props = { manifest: Manifest; fontVariant: "inter" | "playful"; variant: TextVariant };

const EXIT = 12; // frames — whole-scene fade out at the end

function useExit(frame: number, durationInFrames: number) {
  return interpolate(frame, [durationInFrames - EXIT, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });
}

// "added to Nolli" with the brand word in the accent color.
function AddedToNolli({ family, size, color }: { family: string; size: number; color: string }) {
  return (
    <div style={{ fontFamily: family, fontSize: size, color, letterSpacing: 0.5 }}>
      added to <span style={{ color: THEME.accent }}>Nolli</span>
    </div>
  );
}

/** Masked vertical wipe — each line slides up from behind a mask on a beat. */
const LineWipe: React.FC<Props> = ({ manifest, fontVariant }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const f = fontVariant === "inter" ? INTER_FAMILY : PLAYFUL_FAMILY;
  const exit = useExit(frame, durationInFrames);

  const lines: { node: React.ReactNode; size: number; color: string; start: number }[] = [
    {
      node: (
        <>
          {manifest.count} <span style={{ color: THEME.fgSecondary }}>architectures</span>
        </>
      ),
      size: 124,
      color: THEME.fg,
      start: 6,
    },
    {
      node: (
        <>
          by <span style={{ color: THEME.accent }}>{manifest.architect}</span>
        </>
      ),
      size: 68,
      color: THEME.fgSecondary,
      start: 22,
    },
    { node: <AddedToNolli family={f} size={36} color={THEME.fgSecondary} />, size: 36, color: THEME.fgSecondary, start: 38 },
  ];

  return (
    <AbsoluteFill
      style={{ backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center", opacity: exit }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {lines.map((l, i) => {
          const p = spring({ frame: frame - l.start, fps, config: { stiffness: 130, damping: 20 } });
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
              <div
                style={{
                  fontFamily: f,
                  fontSize: l.size,
                  color: l.color,
                  lineHeight: 1.1,
                  transform: `translateY(${(1 - p) * 110}%)`,
                }}
              >
                {l.node}
              </div>
            </div>
          );
        })}
        <div
          style={{
            fontFamily: f,
            fontSize: 22,
            color: THEME.fgSecondary,
            opacity: interpolate(frame, [54, 78], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            marginTop: 26,
          }}
        >
          nolli-map.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Count-up number with a spring overshoot, then directional stamp-ins. */
const Kinetic: React.FC<Props> = ({ manifest, fontVariant }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const f = fontVariant === "inter" ? INTER_FAMILY : PLAYFUL_FAMILY;
  const exit = useExit(frame, durationInFrames);

  const shown = Math.round(interpolate(frame, [0, 28], [0, manifest.count], { extrapolateRight: "clamp" }));
  const numP = spring({ frame, fps, config: { stiffness: 110, damping: 12 } });
  const archX = interpolate(frame, [26, 44], [-60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const archO = interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const byY = interpolate(frame, [40, 56], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const byO = interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagO = interpolate(frame, [56, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center", opacity: exit }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontFamily: f,
            fontSize: 240,
            color: THEME.fg,
            lineHeight: 1,
            transform: `scale(${0.6 + numP * 0.4})`,
          }}
        >
          {shown}
        </div>
        <div style={{ fontFamily: f, fontSize: 46, color: THEME.fgSecondary, opacity: archO, transform: `translateX(${archX}px)` }}>
          architectures
        </div>
        <div style={{ fontFamily: f, fontSize: 42, color: THEME.fgSecondary, opacity: byO, transform: `translateY(${byY}px)` }}>
          by <span style={{ color: THEME.accent }}>{manifest.architect}</span>
        </div>
        <div style={{ marginTop: 20, opacity: tagO }}>
          <AddedToNolli family={f} size={28} color={THEME.fgSecondary} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Restraint — one quiet block fades up and holds. Poster-caption voice. */
const Minimal: React.FC<Props> = ({ manifest, fontVariant }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const f = fontVariant === "inter" ? INTER_FAMILY : PLAYFUL_FAMILY;
  const exit = useExit(frame, durationInFrames);

  const o = interpolate(frame, [10, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [10, 44], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center", opacity: exit }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: o, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: f, fontSize: 28, color: THEME.accent, letterSpacing: 3, textTransform: "uppercase" }}>
          {manifest.architect}
        </div>
        <div style={{ fontFamily: f, fontSize: 100, color: THEME.fg, lineHeight: 1 }}>
          {manifest.count} architectures
        </div>
        <AddedToNolli family={f} size={30} color={THEME.fgSecondary} />
      </div>
    </AbsoluteFill>
  );
};

export const Scene3Count: React.FC<Props> = (props) => {
  switch (props.variant) {
    case "kinetic":
      return <Kinetic {...props} />;
    case "minimal":
      return <Minimal {...props} />;
    case "line-wipe":
    default:
      return <LineWipe {...props} />;
  }
};

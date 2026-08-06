import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { PLAYFUL_FAMILY, INTER_FAMILY } from "../fonts";
import { THEME } from "../lib/theme";
import { OUTRO, exitStartFrame, LOGO_WORD } from "../lib/outro";
import type { TextScene, FontVariant } from "../lib/scenes";
import { DEFAULT_TEXT_SIZE } from "../lib/scenes";

const family = (v: FontVariant) => (v === "inter" ? INTER_FAMILY : PLAYFUL_FAMILY);

// Per-word reveal: each word is uncovered by a left-to-right clip wipe while
// sliding up and clearing a soft blur, staggered word-to-word so the line
// builds rhythmically. Playful variant lands on a spring overshoot; inter lands
// on a smooth ease-out. If `exitStart` is finite, the whole line wipes out
// (slide up + blur + re-clip) together over OUTRO.exitFrames.
const WordReveal: React.FC<{
  text: string;
  frame: number;
  start: number;
  exitStart: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  fontVariant: FontVariant;
}> = ({ text, frame, start, exitStart, fontFamily, fontSize, color, fontVariant }) => {
  const { fps } = useVideoConfig();
  const { reveal, stagger, rise, blur } = OUTRO.word;
  const playful = fontVariant === "playful";
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        gap: "0.28em",
        fontFamily,
        fontSize,
        color,
        lineHeight: 1.1,
      }}
    >
      {words.map((word, i) => {
        const wordStart = start + i * stagger;
        // Entrance progress 0→(1 + overshoot for playful).
        const pIn = playful
          ? spring({
              frame: frame - wordStart,
              fps,
              durationInFrames: reveal,
              config: { damping: 14, stiffness: 130, mass: 0.6 },
            })
          : interpolate(frame, [wordStart, wordStart + reveal], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
        const pInClamped = Math.max(0, Math.min(1, pIn));

        // Exit progress — every word leaves together over the exit window.
        const pOut = Number.isFinite(exitStart)
          ? interpolate(frame, [exitStart, exitStart + OUTRO.exitFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.cubic),
            })
          : 0;

        const translateY = rise * (1 - pIn) - rise * pOut;
        const blurPx = blur * (1 - pInClamped) + blur * pOut;
        const opacity = pInClamped * (1 - pOut);
        const clipRight = Math.max(100 * (1 - pInClamped), 100 * pOut); // %, 100 = fully hidden

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${translateY}px)`,
              filter: blurPx > 0.01 ? `blur(${blurPx}px)` : undefined,
              opacity,
              clipPath: `inset(0 ${clipRight}% 0 0)`,
              willChange: "transform, filter, opacity, clip-path",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Nolli brand mark — the geometric favicon icon, inlined (no staticFile).
// Paths copied from apps/nolli/public/favicon.svg; fill overridden to #EDEAE1.
const NolliMark: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 192 192"
    fill="none"
    style={{ display: "block" }}
    aria-label="Nolli"
  >
    <path d="M158.671 121.476C153.61 123.202 150.802 128.603 152.297 133.737L167.164 184.796C168.407 189.064 172.319 192 176.765 192H182C187.523 192 192 187.523 192 182V124.088C192 117.234 185.261 112.411 178.773 114.623L158.671 121.476Z" fill="#EDEAE1" />
    <path d="M6.48392 173.365C2.60653 174.687 0 178.33 0 182.427C0 187.714 4.28615 192 9.57338 192H143.436C150.1 192 154.9 185.603 153.037 179.204L141.18 138.483C139.586 133.01 133.747 129.974 128.352 131.814L6.48392 173.365Z" fill="#EDEAE1" />
    <path d="M0 148.924C0 155.778 6.73952 160.601 13.2272 158.388L33.3819 151.516C37.3042 150.179 39.9953 146.561 40.1479 142.42L43.444 52.9725C43.6316 47.8826 39.9635 43.465 34.9259 42.7137L11.4751 39.2163C5.43163 38.315 0 42.9966 0 49.1069V148.924Z" fill="#EDEAE1" />
    <path d="M52.5909 130.626C52.3327 137.632 59.176 142.722 65.8113 140.459L125.85 119.989C130.911 118.263 133.719 112.862 132.224 107.728L118.642 61.0835C117.551 57.3351 114.378 54.5646 110.516 53.9886L66.7736 47.4637C60.8764 46.5841 55.5247 51.0276 55.3051 56.986L52.5909 130.626Z" fill="#EDEAE1" />
    <path d="M143.341 102.982C144.935 108.455 150.774 111.49 156.17 109.651L185.227 99.7438C189.277 98.3629 192 94.558 192 90.2788V74.7625C192 69.8095 188.374 65.6027 183.475 64.8719L145.359 59.1862C138.146 58.1101 132.244 64.8697 134.283 71.8725L143.341 102.982Z" fill="#EDEAE1" />
    <path d="M124.434 38.0496C125.525 41.7979 128.698 44.5682 132.56 45.1442L180.525 52.299C186.568 53.2005 192 48.5188 192 42.4084V10C192 4.47715 187.523 0 182 0H126.681C120.016 0 115.216 6.39683 117.08 12.7959L124.434 38.0496Z" fill="#EDEAE1" />
    <path d="M0 16.753C0 21.7061 3.62587 25.9129 8.52479 26.6436L97.717 39.9469C104.931 41.0229 110.833 34.2633 108.793 27.2605L102.953 7.20423C101.71 2.93545 97.7981 0 93.352 0H10C4.47715 0 0 4.47715 0 10V16.753Z" fill="#EDEAE1" />
  </svg>
);

// Generic text scene: per-word wipe-in, hold, then wipe-out before the cut.
export const SegmentText: React.FC<{ scene: TextScene; fontVariant: FontVariant }> = ({
  scene,
  fontVariant,
}) => {
  const frame = useCurrentFrame();
  const size = scene.size ?? DEFAULT_TEXT_SIZE;
  const color = scene.color === "fgSecondary" ? THEME.fgSecondary : THEME.fg;
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center" }}>
      <WordReveal
        text={scene.text}
        frame={frame}
        start={0}
        exitStart={exitStartFrame(0)}
        fontFamily={family(fontVariant)}
        fontSize={size}
        color={color}
        fontVariant={fontVariant}
      />
    </AbsoluteFill>
  );
};

// Logo mark scales/fades in first; "Nolli" reveals to its right with the same
// per-word wipe as the text cards. The mark+word row is centered — the lockup
// seats and holds. No exit: the logo is the final frame.
export const SegmentLogo: React.FC<{ fontVariant: FontVariant }> = ({ fontVariant }) => {
  const frame = useCurrentFrame();
  const markScale = interpolate(frame, [OUTRO.logo.markIn, OUTRO.logo.markSettle], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markOpacity = interpolate(frame, [OUTRO.logo.markIn, OUTRO.logo.markSettle], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 28 }}>
        <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
          <NolliMark size={OUTRO.logo.size} />
        </div>
        <WordReveal
          text={LOGO_WORD}
          frame={frame}
          start={OUTRO.logo.typeStart}
          exitStart={Infinity}
          fontFamily={family(fontVariant)}
          fontSize={120}
          color={THEME.fg}
          fontVariant={fontVariant}
        />
      </div>
    </AbsoluteFill>
  );
};

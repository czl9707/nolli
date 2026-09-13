import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  NO_ANIM,
  NOLLI_WORDMARK_NUDGE,
  NolliMark,
  PLAYFUL,
  SERIF,
  SoftBlurIn,
  cssFontVar,
  fitTextSize,
} from "@nolli/remotion";
import { SceneImage } from "./SceneImage";
import { SceneVideo } from "./SceneVideo";
const FG = "rgb(var(--color-primary-foreground))";
import { OUTRO, LOGO_WORD, BG, VIDEO } from "../lib/constants";
import {
  DEFAULT_TEXT_SIZE,
  type Scene,
  type TextScene,
} from "../lib/scenes";

/** Instrument Serif carries every text card; the logo wordmark alone rides
 *  Kalam. */
const family = (font: TextScene["font"]) => (font === "playful" ? PLAYFUL : SERIF);

// Long names shrink to fit one line within the frame's side margins,
// measured against the real face (the composition renders after fonts-ready,
// so metrics are final). Short cards keep their declared size.
const TEXT_MARGINS = 240;
const MIN_TEXT_SIZE = 56;
const fitSize = (text: string, size: number, fontFamily: string): number =>
  fitTextSize(text, size, fontFamily, VIDEO.width - TEXT_MARGINS * 2, MIN_TEXT_SIZE);

export const SegmentText: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const font = family(scene.font);
  const size = fitSize(scene.text, scene.size ?? DEFAULT_TEXT_SIZE, cssFontVar(font));
  // Exit wipe starts after the reveal window + hold (text cards enter on frame 0).
  const exitStart = OUTRO.typeFrames + OUTRO.hold;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
      <SoftBlurIn
        text={scene.text}
        start={{ when: 0, last: OUTRO.typeFrames, enabled: true }}
        end={{ when: exitStart, last: exitStart + OUTRO.exitFrames, enabled: true }}
        style={{
          fontFamily: font,
          fontSize: size,
          color: FG,
          ...(scene.font === "playful" ? NOLLI_WORDMARK_NUDGE : {}),
        }}
      />
    </AbsoluteFill>
  );
};

// No exit wipe: the logo is the final frame — the lockup seats and holds.
export const SegmentLogo: React.FC = () => {
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
    <AbsoluteFill style={{ backgroundColor: BG, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 28 }}>
        <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
          <NolliMark size={OUTRO.logo.size} />
        </div>
        <SoftBlurIn
          text={LOGO_WORD}
          start={{ when: OUTRO.logo.typeStart, last: OUTRO.logo.typeStart + OUTRO.typeFrames, enabled: true }}
          end={NO_ANIM}
          style={{ fontFamily: PLAYFUL, fontSize: 120, color: FG, ...NOLLI_WORDMARK_NUDGE }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Named SceneRenderer to avoid clashing with the Scene type.
export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case "text":
      return <SegmentText scene={scene} />;
    case "image":
      return <SceneImage scene={scene} />;
    case "video":
      return <SceneVideo scene={scene} />;
    case "logo":
      return <SegmentLogo />;
  }
};

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SoftBlurIn } from "./SoftBlurIn";
import { CLAMP } from "../lib/timeline";
import { REEL_TYPE } from "../lib/type";

const NAME_GAP = 24;

// in 0.5 / hold 0.3 / out 0.5 (~58 frames @45fps)
const LEAD_IN: [number, number] = [2, 16];
const NAME_IN: [number, number] = [8, 26];
const TAIL_IN: [number, number] = [16, 34];
const EXIT: [number, number] = [38, 57];
const BG_OUT: [number, number] = [38, 57];

/** HOOK beat — full-text title card: lead small, name big, map tail small.
 *  The opaque background covers the map until the exit fade reveals it
 *  mid-flight. */
export const HookLockup: React.FC<{ architect: string; lead: string; tail: string }> = ({
  architect,
  lead,
  tail,
}) => {
  const frame = useCurrentFrame();
  const bgOpacity = interpolate(frame, BG_OUT, [1, 0], CLAMP);
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <>
      <AbsoluteFill
        style={{ backgroundColor: "rgb(var(--color-primary-background))", opacity: bgOpacity, zIndex: 4 }}
      />
      <AbsoluteFill
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 5 }}
      >
        <SoftBlurIn
          text={lead}
          start={{ when: LEAD_IN[0], last: LEAD_IN[1], enabled: true }}
          end={{ when: EXIT[0], last: EXIT[1], enabled: true }}
          style={{
            display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
            ...REEL_TYPE.hookYears,
          }}
        />
        <SoftBlurIn
          text={architect}
          start={{ when: NAME_IN[0], last: NAME_IN[1], enabled: true }}
          end={{ when: EXIT[0], last: EXIT[1], enabled: true }}
          style={{
            display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
            ...REEL_TYPE.hookName, marginTop: NAME_GAP,
          }}
        />
        <SoftBlurIn
          text={tail}
          start={{ when: TAIL_IN[0], last: TAIL_IN[1], enabled: true }}
          end={{ when: EXIT[0], last: EXIT[1], enabled: true }}
          style={{
            display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
            ...REEL_TYPE.hookYears, marginTop: NAME_GAP,
          }}
        />
      </AbsoluteFill>
    </>
  );
};

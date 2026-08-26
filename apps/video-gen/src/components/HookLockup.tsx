import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SoftBlurIn } from "./SoftBlurIn";
import { CLAMP } from "../lib/timeline";
import { REEL_TYPE } from "../lib/type";

const NAME_GAP = 24;

// Phases inside the 1.3s HOOK (~58 frames @45fps): name steps in first, tail
// follows; both lift together just before WALK_START so the WALK opens on the
// map already flying. in 0.5 / hold 0.3 / out 0.5.
const NAME_IN: [number, number] = [2, 22];
const TAIL_IN: [number, number] = [14, 34];
const EXIT: [number, number] = [36, 57];
// The card's opaque background fades over the exit tail — the map (already
// mounted underneath) shows through as the text lifts, so the WALK begins on
// a moving frame instead of a hard cut to a static map.
const BG_OUT: [number, number] = [36, 57];

/** HOOK beat — a full-text title card in the CTA's language, centered: the
 *  architect's name big over the map tail ("on a Map.") small.
 *  Per-char blur-in (staggered lines), blur-out-up exit. The opaque card
 *  doubles as the map's cover: the map mounts and holds underneath from
 *  frame 0, revealed mid-exit via the background fade. */
export const HookLockup: React.FC<{ architect: string; tail: string }> = ({
  architect,
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
          text={architect}
          start={{ when: NAME_IN[0], last: NAME_IN[1], enabled: true }}
          end={{ when: EXIT[0], last: EXIT[1], enabled: true }}
          style={{
            display: "block", maxWidth: "88%", minWidth: 0, color: FG, textAlign: "center",
            ...REEL_TYPE.hookName,
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

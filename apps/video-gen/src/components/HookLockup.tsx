import { SoftBlurIn } from "./SoftBlurIn";
import { WALK_START } from "../lib/timeline";

const FONT_SIZE = 104;
const FAMILY = "var(--font-playful)";
/** HOOK title blur-out exit length (frames). Exported so the HOOK `<Sequence>`'s
 *  duration tail stays in lockstep with this exit. */
export const HOOK_EXIT_F = 8;

/** HOOK beat title — present from frame 0 (no entrance anim: `start.enabled = false`),
 *  blur-out-up exits across `[WALK_START, WALK_START + HOOK_EXIT_F]`. */
export const HookLockup: React.FC<{ title: string }> = ({ title }) => {
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <SoftBlurIn
      text={title}
      start={{ when: 0, last: 0, enabled: false }}
      end={{ when: WALK_START, last: WALK_START + HOOK_EXIT_F, enabled: true }}
      style={{
        textAlign: "right", maxWidth: "100%", minWidth: 0,
        fontSize: FONT_SIZE, fontFamily: FAMILY, color: FG,
      }}
    />
  );
};

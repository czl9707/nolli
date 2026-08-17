import { SoftBlurIn } from "./SoftBlurIn";
import { WALK_START } from "../lib/timeline";
import { REEL_TYPE } from "../lib/type";

const LINE_GAP = 12;
/** HOOK title blur-out exit length (frames). Exported so the HOOK `<Sequence>`'s
 *  duration tail stays in lockstep with this exit. */
export const HOOK_EXIT_F = 8;

/** HOOK beat title — present from frame 0 (no entrance anim: `start.enabled = false`),
 *  blur-out-up exits across `[WALK_START, WALK_START + HOOK_EXIT_F]`. Rendered as
 *  two explicit right-aligned lines (name / year range) so the browser never
 *  chooses the wrap point. Name leads (700); years read as data under it
 *  (light + letterspaced). */
export const HookLockup: React.FC<{ architect: string; subtitle: string }> = ({
  architect,
  subtitle,
}) => {
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <div style={{ textAlign: "right" }}>
      {[architect, subtitle].map((text, i) => (
        <SoftBlurIn
          key={i}
          text={text}
          start={{ when: 0, last: 0, enabled: false }}
          end={{ when: WALK_START, last: WALK_START + HOOK_EXIT_F, enabled: true }}
          style={{
            display: "block", maxWidth: "100%", minWidth: 0, color: FG,
            ...REEL_TYPE[i > 0 ? "hookYears" : "hookName"],
            ...(i > 0 ? { marginTop: LINE_GAP } : {}),
          }}
        />
      ))}
    </div>
  );
};

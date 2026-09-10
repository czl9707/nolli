// apps/video-gen/src/components/EndLockup.tsx
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CLAMP, secToFrames } from "@/lib/timeline";
import { REEL_TYPE } from "@/lib/type";
import { NO_ANIM, SoftBlurIn } from "@nolli/remotion";

const LINE_REVEAL = 4;
const LINE_REVEAL_END = 40;
const LINE_EXIT = 54;
const LINE_EXIT_END = 62;
const LOCK_START = 68;
const MARK_IN: [number, number] = [LOCK_START, LOCK_START + secToFrames(0.3)];

// The favicon follows the document-level pinned light color-scheme (see
// MapProvider) — its prefers-color-scheme: light branch applies.
/** END beat: a fresh opaque scene — background fades in over the first ~8
 *  frames so the cut isn't a hard flash, fully hiding the walk frame — then
 *  the original lockup compressed into the 2.5s window: lead line blurs in
 *  and out, favicon + wordmark row scales in and holds. Frame is
 *  END-relative. */
export const EndLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIn = interpolate(frame, [0, 8], [0, 1], CLAMP);
  const markScale = interpolate(frame, MARK_IN, [0.6, 1], CLAMP);
  const markOpacity = interpolate(frame, MARK_IN, [0, 1], CLAMP);
  const FG = "rgb(var(--color-primary-foreground))";
  return (
    <>
      {/* zIndex 10: the scene background must cover ALL chrome (title, ledger,
       *  corner brand all sit at 6) and the lockup content must clear it. */}
      <AbsoluteFill
        style={{ background: "rgb(var(--color-primary-background))", opacity: sceneIn, zIndex: 10 }}
      />
      <AbsoluteFill
        style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
      >
        <div style={{ position: "absolute" }}>
          <SoftBlurIn
            text="Explore more in"
            start={{ when: LINE_REVEAL, last: LINE_REVEAL_END, enabled: true }}
            end={{ when: LINE_EXIT, last: LINE_EXIT_END, enabled: true }}
            style={{ ...REEL_TYPE.ctaLead, color: FG }}
          />
        </div>
        <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Img src={staticFile("favicon.svg")} style={{ width: 72, height: 72 }} />
          </div>
          <SoftBlurIn
            text="Nolli"
            start={{ when: LOCK_START, last: LOCK_START + 16, enabled: true }}
            end={NO_ANIM}
            style={{ ...REEL_TYPE.ctaWordmark, color: FG }}
          />
        </div>
      </AbsoluteFill>
    </>
  );
};

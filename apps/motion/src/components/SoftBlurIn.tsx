import { softBlurChar, SOFT_BLUR_DEFAULTS, type SoftBlurOpts } from "../lib/text-anim";

/** Per-character soft-blur reveal (entrance) with an optional blur-out-up exit.
 *  Driven by an explicit `frame` prop rather than `useCurrentFrame` so it stays
 *  controllable from the timeline (e.g. CtaLockup's cta-relative frame).
 *
 *  Typography (fontSize / fontWeight / color) is optional and inherited from the
 *  surrounding element when omitted — wrap in an <H3> etc. to match its scale. */
export const SoftBlurIn: React.FC<{
  text: string;
  frame: number;
  start?: number;
  exitStart?: number;
  blur?: number;
  risePx?: number;
  revealF?: number;
  staggerF?: number;
  exitF?: number;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  frame,
  start,
  exitStart,
  blur,
  risePx,
  revealF,
  staggerF,
  exitF,
  fontSize,
  fontWeight,
  fontFamily,
  color,
  style,
}) => {
  const opts: SoftBlurOpts = {
    ...SOFT_BLUR_DEFAULTS,
    ...(start !== undefined && { start }),
    ...(exitStart !== undefined && { exitStart }),
    ...(blur !== undefined && { blurPx: blur }),
    ...(risePx !== undefined && { risePx }),
    ...(revealF !== undefined && { revealF }),
    ...(staggerF !== undefined && { staggerF }),
    ...(exitF !== undefined && { exitF }),
  };

  return (
    <span
      style={{
        display: "inline-flex",
        ...(fontSize !== undefined && { fontSize }),
        ...(fontWeight !== undefined && { fontWeight }),
        ...(fontFamily !== undefined && { fontFamily }),
        ...(color !== undefined && { color }),
        lineHeight: 1.1,
        ...style,
      }}
    >
      {[...text].map((ch, i) => {
        const { opacity, blur: blurPx, translateY } = softBlurChar(frame, i, opts);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              filter: blurPx > 0.01 ? `blur(${blurPx}px)` : undefined,
              transform: `translateY(${translateY}px)`,
              whiteSpace: "pre",
              willChange: "transform, filter, opacity",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

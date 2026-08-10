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

  // Group into word / whitespace tokens so the text wraps at word boundaries.
  // Each char-span is an atomic inline box; without word grouping a long word
  // could split mid-word when the layout wraps. Words render as nowrap groups of
  // char-spans; whitespace tokens are inline pre spacers that preserve width.
  const chars = [...text];
  const tokens: { kind: "word" | "space"; text: string; start: number }[] = [];
  let i = 0;
  while (i < chars.length) {
    const isSpace = /\s/.test(chars[i]);
    let j = i;
    while (j < chars.length && /\s/.test(chars[j]) === isSpace) j++;
    tokens.push({ kind: isSpace ? "space" : "word", text: chars.slice(i, j).join(""), start: i });
    i = j;
  }

  return (
    <span
      style={{
        display: "inline-block",
        ...(fontSize !== undefined && { fontSize }),
        ...(fontWeight !== undefined && { fontWeight }),
        ...(fontFamily !== undefined && { fontFamily }),
        ...(color !== undefined && { color }),
        lineHeight: 1.1,
        ...style,
      }}
    >
      {tokens.map((tok, ti) => {
        if (tok.kind === "space") {
          return (
            <span key={ti} style={{ display: "inline-block", whiteSpace: "pre" }}>
              {tok.text}
            </span>
          );
        }
        return (
          <span key={ti} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {[...tok.text].map((ch, ci) => {
              const { opacity, blur: blurPx, translateY } = softBlurChar(frame, tok.start + ci, opts);
              return (
                <span
                  key={ci}
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
      })}
    </span>
  );
};

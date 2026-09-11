// apps/video-gen/src/components/grid/PosterTitle.tsx
import { REEL_TYPE, ACCENT } from "@/lib/type";

/** Poster title block: a two-line serif headline ("<count> Architectures /
 *  by <name>") — every headline word the same size, the architect's name the
 *  only italic and the only accent — with the seed-time quote tucked into
 *  the block's bottom-right corner. Static for the whole reel, frame 0 on. */
export const PosterTitle: React.FC<{
  architect: string;
  count: number;
  quote?: string;
}> = ({ architect, count, quote }) => (
  <>
    <div
      style={{
        ...REEL_TYPE.posterName,
        color: "rgb(var(--color-primary-foreground))",
        lineHeight: 1.25,
      }}
    >
      {count} Architectures
      <br />
      by <span style={{ color: ACCENT, fontStyle: "italic" }}>{architect}</span>
    </div>
    {quote ? (
      <div style={{ marginTop: "auto", alignSelf: "flex-end", textAlign: "right", maxWidth: "85%" }}>
        <span style={{ ...REEL_TYPE.posterQuote, color: "rgb(var(--color-secondary-foreground))", lineHeight: 1.4 }}>
          "{quote}"
        </span>
      </div>
    ) : null}
  </>
);

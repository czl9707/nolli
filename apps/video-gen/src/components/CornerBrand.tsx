import { reelTitle } from "../lib/config";

const FG = "rgb(var(--color-primary-foreground))";
const FG2 = "rgb(var(--color-secondary-foreground))";

/** Persistent corner brand through WALK on the right (bg) zone. `corner="top"`
 *  = the reel's descriptive title; `corner="bottom"` = the @nolli.map handle. */
export const CornerBrand: React.FC<{
  corner: "top" | "bottom";
  title?: string; // top only; the bottom handle ignores it
  opacity: number;
}> = ({ corner, title, opacity }) => {
  if (corner === "top") {
    return (
      <span style={{ fontFamily: "var(--font-playful)", fontWeight: 500, fontSize: 22, color: FG, lineHeight: 1, opacity }}>
        {title}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 16, letterSpacing: "0.04em", color: FG2, lineHeight: 1, opacity }}>
      @nolli.map
    </span>
  );
};

// apps/video-gen/src/components/grid/CornerBrand.tsx
import { NO_ANIM, SoftBlurIn } from "@nolli/remotion";
import { staticFile } from "remotion";
import { REEL_TYPE } from "@/lib/type";
import { landFrame } from "@/lib/timeline";
import type { ReelBuilding } from "@/lib/config";

const FG = "rgb(var(--color-primary-foreground))";
const FG2 = "rgb(var(--color-secondary-foreground))";

// Corner cells mount INSIDE the padding-band panes — the grid's own hairlines
// bound them. Absolutely inset so the pane's flex sizing can't skew the
// centering. Horizontally padded from the pane edge, vertically centered in
// the band. Static from frame 0.
const cell: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  padding: "0 24px",
};

export const BrandMark: React.FC = () => (
  <div style={{ ...cell, justifyContent: "flex-start", gap: 14 }}>
    <img src={staticFile("favicon.svg")} alt="" width={36} height={36} style={{ display: "block" }} />
    <span style={{ ...REEL_TYPE.posterBrand, color: FG, lineHeight: 1 }}>Nolli</span>
  </div>
);

export const HandleMark: React.FC = () => (
  <span style={{ ...REEL_TYPE.cornerHandle, color: FG2, lineHeight: 1 }}>@nolli.map</span>
);

/** The building currently on the map: its name (serif italic) over
 *  CITY, CC YEAR — soft-blur in on its landing, blur out on the next.
 *  All slots mount absolutely stacked so varying widths don't reflow. */
export const CurrentWork: React.FC<{ buildings: ReelBuilding[] }> = ({ buildings }) => (
  <div style={{ position: "relative", flex: 1, alignSelf: "stretch", minWidth: 0 }}>
    {buildings.map((b, i) => {
      const landF = landFrame(i);
      const nextF = landFrame(i + 1);
      const isLast = i === buildings.length - 1;
      const enter = { when: landF, last: landF + 12, enabled: true };
      const exit = isLast ? NO_ANIM : { when: nextF, last: nextF + 10, enabled: true };
      return (
        <div
          key={b.slug}
          style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}
        >
          <SoftBlurIn text={b.name} start={enter} end={exit} style={{ ...REEL_TYPE.cornerWorkName, color: FG }} />
          <SoftBlurIn
            text={`${b.city}, ${b.countryCode} ${b.year}`}
            start={{ when: landF + 4, last: landF + 16, enabled: true }}
            end={exit}
            style={{ ...REEL_TYPE.cornerWorkMeta, color: FG2, textTransform: "uppercase" }}
          />
        </div>
      );
    })}
  </div>
);

/** The bottom band: the current work at the left edge, handle at the right. */
export const BottomBand: React.FC<{ buildings: ReelBuilding[] }> = ({ buildings }) => (
  <div style={{ ...cell, justifyContent: "space-between" }}>
    <CurrentWork buildings={buildings} />
    <HandleMark />
  </div>
);

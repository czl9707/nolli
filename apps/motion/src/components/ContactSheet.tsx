import { Img, staticFile } from "remotion";
import { THEME } from "../theme";
import { visibleWindow } from "../lib/contact-sheet";

const WINDOW = 7;

export const ContactSheet: React.FC<{ slug: string; buildings: { slug: string; year: number }[]; currentIndex: number }> = ({ slug, buildings, currentIndex }) => {
  const idxs = visibleWindow({ currentIndex, count: buildings.length, windowSize: WINDOW });
  return (
    <div style={{ height: 120, borderTop: `1px solid ${THEME.bgSecondary}`, paddingTop: 10, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
      {idxs.map((i) => {
        const b = buildings[i];
        const isCurrent = i === currentIndex;
        return (
          <div key={b.slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: isCurrent ? 1 : 0.5 }}>
            <div style={{ width: isCurrent ? 72 : 56, height: isCurrent ? 72 : 56, borderRadius: 6, overflow: "hidden", outline: isCurrent ? `2px solid ${THEME.accent}` : "none" }}>
              <Img src={staticFile(`capture/${slug}/images/${b.slug}-thumb.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: 11, color: isCurrent ? THEME.accent : THEME.fgSecondary }}>{b.year}</span>
          </div>
        );
      })}
    </div>
  );
};

import { AbsoluteFill, Img, Series, staticFile } from "remotion";
import { INTRO_COUNT, INTRO_IMG_FRAMES } from "../lib/timeline";

/** INTRO beat — board-lightbox stills, hard cuts, full-bleed. The first frame
 *  is a complete image (the feed poster frame), no fade from black. */
export const Intro: React.FC<{ slug: string }> = ({ slug }) => (
  <AbsoluteFill style={{ zIndex: 6, backgroundColor: "rgb(var(--color-primary-background))" }}>
    <Series>
      {Array.from({ length: INTRO_COUNT }, (_, i) => (
        <Series.Sequence key={i} durationInFrames={INTRO_IMG_FRAMES} layout="none">
          <Img
            src={staticFile(`data/${slug}/images/intro-${i + 1}.jpg`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

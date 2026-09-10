// apps/video-gen/src/components/PaperCard.tsx
import { Img, staticFile } from "remotion";
import { jitter, hashId, paperClipPath } from "@nolli/ui/paper";

// staticFile resolves the Remotion static base ("/public") at runtime; outside
// a bundle (tests) it falls back to the root-absolute path.
const GRASS = `url(${staticFile("patterns/dark/grass.png")})`;

/** The paper photo card — inline-styled port of landing's PaperPhoto minus
 *  caption/pin/motion. Deterministic: seeded tilt + torn clip; the consumer
 *  owns motion and positioning. */
export const PaperCard: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  seed: string;
  tilt?: number;
}> = ({ src, alt, width, height, seed, tilt = 2 }) => {
  const rotate = jitter(hashId(seed) + 50, tilt) - tilt / 2;
  return (
    <div style={{ display: "inline-block", filter: "drop-shadow(4px 4px 4px rgb(var(--color-paper-foreground) / 0.4))" }}>
      <div
        style={{
          position: "relative",
          padding: 8,
          boxSizing: "border-box",
          overflow: "hidden",
          background: "rgb(var(--color-paper-background))",
          transform: `rotate(${rotate}deg)`,
          clipPath: paperClipPath(seed),
        }}
      >
        <Img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ display: "block", width, height, objectFit: "cover", background: "rgb(var(--color-paper-background))" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: GRASS,
            backgroundSize: "128px 128px",
            opacity: 0.3,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

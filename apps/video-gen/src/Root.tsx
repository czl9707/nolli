import { Composition, staticFile } from "remotion";
import { ReelComposition } from "./ReelComposition";
import { FPS, totalFrames } from "./lib/timeline";
import type { ReelConfig } from "./lib/config";

const FALLBACK_COUNT = 9; // pre-metadata duration; calculateMetadata overrides per slug.

/** Resolve the reel's frame count from its staged config. Reel length scales with
 *  building count (HOOK + count×SLOT + CTA), so the duration must be derived per
 *  architect — not fixed at registration time. */
const reelDurationInFrames = async (slug: string): Promise<number> => {
  const res = await fetch(staticFile(`capture/${slug}/reel.json`));
  const cfg = (await res.json()) as ReelConfig;
  return totalFrames(cfg.buildings.length);
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="reel"
      component={ReelComposition}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={totalFrames(FALLBACK_COUNT)}
      defaultProps={{ slug: "sanaa" }}
      calculateMetadata={async ({ props }) => ({
        durationInFrames: await reelDurationInFrames(props.slug),
      })}
    />
  );
};

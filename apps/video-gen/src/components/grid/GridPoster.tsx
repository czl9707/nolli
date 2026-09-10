// apps/video-gen/src/components/grid/GridPoster.tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { HSplit, Pane, Screen, VSplit } from "./grid";
import { MapProvider } from "@/components/map/MapProvider";
import { CameraSeries } from "@/components/map/CameraSeries";
import { CardWalk } from "./CardWalk";
import { BrandMark, BottomBand } from "./CornerBrand";
import { PosterTitle } from "./PosterTitle";
import { PosterList } from "./PosterList";
import { ONE_PIN_VP } from "@/lib/viewport";
import { type ReelBuilding, type ReelConfig } from "@/lib/config";
import { CLAMP, INTRO_FRAMES, REEL_W, endStart } from "@/lib/timeline";

const SCREEN_PADDING = {
  top: 96,
  left: 96,
  right: 96,
  bottom: 96,
}
const PADDING = 32

const MAP_HEIGHT = 498;
const MAP_WIDTH = REEL_W - SCREEN_PADDING.left - SCREEN_PADDING.right;

/** Grid variant: landing pane logic. Four hairlines split out the 64px
 *  padding band; the map owns the top pane, the bottom pane splits into
 *  title | list. */
export const GridPoster: React.FC<{ cfg: ReelConfig; buildings: ReelBuilding[] }> = ({ cfg, buildings }) => {
  const frame = useCurrentFrame();
  // The bottom hairline doubles as the progress track: a full-strength
  // foreground segment grows along it from the first landing to the last.
  const progress = interpolate(frame, [INTRO_FRAMES, endStart(buildings.length)], [0, 1], CLAMP);
  return (
  <Screen>
    <HSplit>
      <Pane size={`${SCREEN_PADDING.top}px`}>
        <VSplit>
          <Pane size={`${SCREEN_PADDING.left}px`} />
          <Pane>
            <BrandMark />
          </Pane>
          <Pane size={`${SCREEN_PADDING.right}px`} filled/>
        </VSplit>
      </Pane>
      <Pane>
        <VSplit>
          <Pane size={`${SCREEN_PADDING.left}px`}>
            <HSplit>
              <Pane size={`${MAP_HEIGHT}px`} />
              <Pane filled/>
            </HSplit>
          </Pane>
          <Pane>
            <HSplit>
              <Pane size={`${MAP_HEIGHT}px`}>
                <AbsoluteFill>
                  <MapProvider 
                    plate={{ 
                      left: 0, top: 0, width: MAP_WIDTH, height: MAP_HEIGHT }} 
                    veilOpacity={0.4} 
                    worldCopies
                  >
                    <CameraSeries buildings={buildings} vp={ONE_PIN_VP} />
                  </MapProvider>
                </AbsoluteFill>
              </Pane>
              <Pane>
                <VSplit>
                  <Pane size="50%">
                    {/* absolute inset so the pane's flex basis stays the grid's
                        slot — a height:100% child doesn't resolve through the
                        indefinite flex chain and would grow the pane. */}
                    <div style={{ position: "absolute", inset: 0, padding: PADDING, paddingTop: PADDING * 2, boxSizing: "border-box",
                      display: "flex", flexDirection: "column"  }}>
                      <PosterTitle architect={cfg.architect} count={buildings.length} quote={cfg.quote} />
                    </div>
                  </Pane>
                  <Pane>
                    <div style={{ position: "absolute", inset: 0, padding: PADDING, paddingTop: PADDING * 2, boxSizing: "border-box",
                      display: "flex", flexDirection: "column" }}>
                      <PosterList buildings={buildings} width={MAP_WIDTH / 2 - PADDING * 2} capacity={8} />
                    </div>
                  </Pane>
                </VSplit>
              </Pane>
            </HSplit>
          </Pane>
          <Pane size={`${SCREEN_PADDING.right}px`}>
            <HSplit>
              <Pane size={`${MAP_HEIGHT}px`} filled/>
              <Pane/>
            </HSplit>
          </Pane>
        </VSplit>
      </Pane>
      <Pane size={`${SCREEN_PADDING.bottom}px`}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: `${progress * 100}%`, background: "rgb(var(--color-primary-foreground))" }} />
        <VSplit>
          <Pane size={`${SCREEN_PADDING.left}px`} />
          <Pane>
            <BottomBand buildings={buildings} />
          </Pane>
          <Pane size={`${SCREEN_PADDING.right}px`} filled/>
        </VSplit>
      </Pane>
    </HSplit>
    {/* Map pane rect in poster px — overlay sits above the hairlines so a
        card may cross one but never be cropped by it. */}
    <CardWalk slug={cfg.slug} buildings={buildings} vp={ONE_PIN_VP} plate={{
      left: 64,
      top: 64,
      width: REEL_W - SCREEN_PADDING.left - SCREEN_PADDING.right,
      height: MAP_HEIGHT }}
    />
  </Screen>
  );
};

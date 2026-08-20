import { useEffect } from "react";
import { continueRender, delayRender } from "remotion";

/** Gate captures on the two reel fonts resolving (the @fontsource CSS uses
 *  font-display:swap, so a capture could otherwise beat the swap window and
 *  bake in the fallback).
 *
 *  Component-level, NOT module-level: module code also runs in the
 *  short-lived metadata/composition-evaluation pages Remotion closes right
 *  after use — a delayRender there can lose its continueRender to page
 *  teardown, and the orphaned handle kills long renders at its timeout. */
export function useFontsReady(): void {
  useEffect(() => {
    const handle = delayRender("Loading reel fonts", { timeoutInMilliseconds: 60_000 });
    let cleared = false;
    const clear = () => {
      if (!cleared) {
        cleared = true;
        continueRender(handle);
      }
    };
    Promise.race([
      Promise.all([
        document.fonts.load('400 96px "Architects Daughter"'),
        document.fonts.load('400 96px "Quicksand Variable"'),
      ]),
      // The bundled fonts are inline data URIs and resolve in milliseconds;
      // this ceiling exists so no page quirk can hold the handle open.
      new Promise((r) => setTimeout(r, 30_000)),
    ]).then(clear, clear);
    return clear;
  }, []);
}

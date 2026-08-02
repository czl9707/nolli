import type { Browser, BrowserContextOptions, Page } from "playwright";

// Software WebGL for headless readback + sRGB color profile so screenshots
// aren't color-shifted by Chromium's color management.
export const LAUNCH_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader-webgl",
  "--force-color-profile=srgb",
];

// Force the app into dark mode. The theme store reads localStorage('theme') at
// init; setting it before first paint guarantees resolvedTheme='dark' regardless
// of any persisted preference. colorScheme:'dark' also makes the system fallback
// agree.
export const DARK_INIT = `
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}
`;

// Slow-mo factor for the morph capture. The app's clock runs at SLOWMO x wall
// speed so the same ~1.2s morph is sampled by ~4x more real frames, then we
// resample back to real-time 30fps. 0.25 keeps morph frozen-frames to ~2/36.
// IMPORTANT: keep the interaction wall-time SHORT — Chrome throttles the
// compositor (and thus CDP screencast) during long idle settles, which starves
// the capture. Short waits yielded ~270 frames; long waits ~99.
export const SLOWMO = 0.25;

// framer-motion v12 gates its native WAAPI path on a lazy feature flag that does
// `div.animate({opacity:[1]})` in a try/catch. Native animations bind to
// document.timeline (real wall clock), which the JS clock wrapper can't slow —
// so board entrances (opacity/scale) pop in at full speed during the slowed
// capture. Making Element.prototype.animate throw flips that flag to false,
// forcing framer-motion onto its JS value loop (MotionValues + framesync), which
// CLOCK_INIT DOES slow. Layout props (width/height) already use the JS loop, so
// the surface morph is unaffected. Installed via addInitScript, before framer-
// motion loads and evaluates the flag.
export const ANIM_INIT = `
(function () {
  Element.prototype.animate = function () { throw new Error("no waapi"); };
})();
`;

// before framer-motion loads. framer-motion v12 captures requestAnimationFrame
// once at module-init (`typeof requestAnimationFrame ? requestAnimationFrame : …`),
// so overriding window.requestAnimationFrame at runtime is too late: it already
// holds the original, and its entrance animations (board polaroids, pin fades,
// modal) would play at real speed and pop in. Wrapping the clocks at init, with
// the factor read from window.__SLOWMO (default 1 = real-time), lets us flip the
// WHOLE app — MapLibre camera AND framer-motion — to slow-mo at capture time.
// Identity at factor 1, so non-capture contexts are unaffected.
export const CLOCK_INIT = `
(() => {
  const rn = performance.now.bind(performance);
  const dn = Date.now.bind(Date);
  const raf = window.requestAnimationFrame.bind(window);
  const w0 = rn(), d0 = dn();
  const f = () => (typeof window.__SLOWMO === "number" ? window.__SLOWMO : 1);
  performance.now = () => w0 + (rn() - w0) * f();
  Date.now = () => Math.round(d0 + (dn() - d0) * f());
  window.requestAnimationFrame = (cb) => raf((ts) => cb(w0 + (ts - w0) * f()));
})();
`;

export async function newDarkContext(
  browser: Browser,
  extra: BrowserContextOptions = {},
) {
  const context = await browser.newContext({ colorScheme: "dark", ...extra });
  await context.addInitScript(DARK_INIT);
  await context.addInitScript(CLOCK_INIT);
  await context.addInitScript(ANIM_INIT);
  return context;
}

export async function waitForStable(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document as Document).fonts.ready);
  // Wait for the map markers to actually render (architecture pins are
  // .maplibregl-marker) so we don't shoot before they appear.
  await page
    .locator(".maplibregl-marker")
    .first()
    .waitFor({ state: "attached", timeout: 8000 })
    .catch(() => {});
  // Let a sonner toast auto-dismiss if one fired on load.
  const toast = page.locator("[data-sonner-toast]");
  if (await toast.count()) {
    await toast.waitFor({ state: "hidden", timeout: 6000 }).catch(() => {});
  }
  await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 4000));
}

type CaptureMap = { isMoving: () => boolean };

// Wait for the in-flight camera move (`easeTo`/`panBy`, issued via
// `window.__nolliMap` under `?capture=1`) to reach moveend. `page.evaluate`
// returns the instant `easeTo` is *called* — not when the animation finishes —
// so the next move MUST await this, otherwise `panBy` retargets mid-flight and
// the sequence collapses. Resolves silently on timeout so a stuck move never
// aborts the run.
//
// NOTE: Playwright's `waitForFunction` takes `(fn, arg, options)`; the options
// object MUST be the 3rd arg. Passing `{timeout}` as the 2nd silently makes it
// the predicate arg and falls back to the 30s default.
export async function waitForMoveEnd(page: Page, timeoutMs = 6000) {
  await page
    .waitForFunction(
      () => {
        const m = (window as unknown as { __nolliMap?: CaptureMap }).__nolliMap;
        return !!m && !m.isMoving();
      },
      undefined,
      { timeout: timeoutMs },
    )
    .catch(() => {});
}

// Wait `appMs` of APP time. Under slow-mo, app time advances at SLOWMO × wall
// time, so the equivalent wall wait is `appMs / SLOWMO`. Expressing tunable
// durations in app-ms keeps them in the units the final real-time video shows.
export async function appWait(page: Page, appMs: number) {
  await page.waitForTimeout(appMs / SLOWMO);
}

// Node-side poll (real wall-time) for MapLibre tile-readiness. Used during the
// off-camera warm-up before slow-mo is flipped. Returns whether the map reported
// all tiles loaded (false = timed out). NOTE: keep page.evaluate predicates as
// simple arrow functions — tsx decorates nested/async in-page functions with a
// `__name` helper that is undefined once Playwright serializes the function to
// the page, throwing "ReferenceError: __name is not defined".
export async function waitForTilesLoaded(
  page: Page,
  timeoutMs = 6000,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const m = (window as unknown as { __nolliMap?: { areTilesLoaded: () => boolean } }).__nolliMap;
        return !!m && m.areTilesLoaded();
      },
      undefined,
      { timeout: timeoutMs },
    );
    return true;
  } catch {
    return false;
  }
}

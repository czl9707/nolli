import type { Browser, BrowserContextOptions, Page } from "playwright";
import type { NolliCaptureMap } from "./page-ops";
import { CURSOR_INIT } from "./cursor";

// The app under capture — a dev server (pnpm --filter nolli dev). Override with
// BASE_URL when it runs on another port.
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// Software WebGL for headless readback + sRGB color profile so screenshots
// aren't color-shifted by Chromium's color management.
export const LAUNCH_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader-webgl",
  "--force-color-profile=srgb",
  // The app's DB host (db.nolli-map.com) CORS-allowlists localhost:5173 only;
  // when the app runs on another port (5173 taken by another dev server), the
  // DB fetch would be blocked and the app would boot to /error with no map.
  // This browser is a throwaway capture instance, so relaxing CORS is safe.
  "--disable-web-security",
];

const DARK_INIT = `
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}
`;

// framer-motion v12 gates its native WAAPI path on a lazy feature flag that does
// `div.animate({opacity:[1]})` in a try/catch. Native animations bind to
// document.timeline (real wall clock), which the JS clock wrapper can't slow —
// so board entrances (opacity/scale) pop in at full speed during the slowed
// capture. Making Element.prototype.animate throw flips that flag to false,
// forcing framer-motion onto its JS value loop (MotionValues + framesync), which
// CLOCK_INIT DOES slow. Layout props (width/height) already use the JS loop, so
// the surface morph is unaffected. Installed via addInitScript, before framer-
// motion loads and evaluates the flag.
const ANIM_INIT = `
(function () {
  Element.prototype.animate = function () { throw new Error("no waapi"); };
})();
`;

// framer-motion v12 captures requestAnimationFrame once at module-init
// (`typeof requestAnimationFrame ? requestAnimationFrame : …`), so overriding
// window.requestAnimationFrame at runtime is too late: it already holds the
// original, and its entrance animations (board polaroids, pin fades, modal)
// would play at real speed and pop in. Wrapping the clocks at init, with the
// factor read from window.__SLOWMO (default 1 = real-time), lets us flip the
// WHOLE app — MapLibre camera AND framer-motion — to slow-mo at capture time.
// Identity at factor 1, so non-capture contexts are unaffected.
//
// setTimeout/setInterval are scaled too: app transitions triggered by a timer
// (e.g. MapFlyNavigator's board-open flyTo, which fires off setTimeout(TRANSITION_SHORT))
// must stay in lockstep with the rAF-driven framer morph. Without this, the flyTo
// fires in real time while the morph runs slow, so it races the container resize
// and the building never recenters — the marker lands off the inset. f() is 1
// until __SLOWMO is flipped, so warm-up (pre-slowmo) stays real-time.
const CLOCK_INIT = `
(() => {
  const rn = performance.now.bind(performance);
  const dn = Date.now.bind(Date);
  const raf = window.requestAnimationFrame.bind(window);
  const w0 = rn(), d0 = dn();
  const f = () => (typeof window.__SLOWMO === "number" ? window.__SLOWMO : 1);
  performance.now = () => w0 + (rn() - w0) * f();
  Date.now = () => Math.round(d0 + (dn() - d0) * f());
  window.requestAnimationFrame = (cb) => raf((ts) => cb(w0 + (ts - w0) * f()));
  const _st = window.setTimeout, _si = window.setInterval;
  window.setTimeout = (cb, ms, ...a) => _st(cb, (ms ?? 0) / f(), ...a);
  window.setInterval = (cb, ms, ...a) => _si(cb, (ms ?? 0) / f(), ...a);
})();
`;

// ── Board-package selectors ─────────────────────────────────────────────────
// Hash-proof selectors encoding packages/board internals: polaroid wrappers
// carry inline `transform: rotate(...)` (NOT rotateX/rotateZ like map pins),
// every BoardItem renders a pushpin <img src="/images/pin.png"> which must be
// excluded, and the modal's framer-motion backdrop is the only element whose
// CSS-module class contains 'backdrop'. If packages/board changes shape, these
// are the single place to update.
export const BOARD_PHOTO = 'div[style*="rotate("] img:not([src*="pin.png"])';
export const LIGHTBOX_BACKDROP = "div[class*='backdrop']";
export const LIGHTBOX_FRAME = 'div[style*="aspect-ratio"]';

export async function applyBrowserCaptureContext(
  browser: Browser,
  extra: BrowserContextOptions = {},
) {
  const context = await browser.newContext({ colorScheme: "dark", ...extra });
  await context.addInitScript(DARK_INIT);
  await context.addInitScript(CLOCK_INIT);
  await context.addInitScript(ANIM_INIT);
  await context.addInitScript(CURSOR_INIT);
  return context;
}

export async function waitForToastDisappear(page: Page) {
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

export async function waitForMapMoveEnd(page: Page, timeoutMs = 6000) {
  await page
    .waitForFunction(
      () => {
        const m = (window as unknown as { __nolliMap?: Pick<NolliCaptureMap, "isMoving"> }).__nolliMap;
        return !m || !m.isMoving();
      },
      undefined,
      { timeout: timeoutMs },
    )
    .catch(() => {});
}

// Polls from Node, so it runs on real wall-time — unaffected by the slowed
// in-page clocks.
export async function waitForTilesLoaded(
  page: Page,
  timeoutMs = 6000,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const m = (window as unknown as { __nolliMap?: Pick<NolliCaptureMap, "areTilesLoaded"> }).__nolliMap;
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

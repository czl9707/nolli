import type { Browser, BrowserContextOptions, Page } from "playwright";

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

export const DARK_INIT = `
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
//
// setTimeout/setInterval are scaled too: app transitions triggered by a timer
// (e.g. MapFlyNavigator's board-open flyTo, which fires off setTimeout(TRANSITION_SHORT))
// must stay in lockstep with the rAF-driven framer morph. Without this, the flyTo
// fires in real time while the morph runs slow, so it races the container resize
// and the building never recenters — the marker lands off the inset. f() is 1
// until __SLOWMO is flipped, so warm-up (pre-slowmo) stays real-time.
// A purely-presentational cursor overlay so the pointer is visible in the CDP
// screencast (headless Chromium never composites the native OS cursor, so
// clicks/drags would otherwise be invisible on camera). pointer-events:none,
// hidden until the first pointermove. All motion comes from real page.mouse
// events — this element just follows them — so hover states and the board-pan
// pointerdown logic are untouched. Press feedback (a small shrink toward the
// tip) fires on pointerdown/up.
//
// The element is appended to documentElement on DOMContentLoaded (NOT at
// document_start): addInitScript runs before the HTML parser finishes, and any
// nodes appended then are discarded when the parser rebuilds the tree. The
// window-level listeners are installed immediately (window is stable across the
// parse) and lazily create the element on the first pointermove as a fallback.
export const CURSOR_INIT = `
(() => {
  if (window.__nolliCursor) return;
  window.__nolliCursor = true;
  let el = null;
  const ensure = () => {
    if (el || !document.documentElement) return;
    const style = document.createElement('style');
    style.textContent = '#__nolli_cursor{position:fixed;top:0;left:0;width:24px;height:24px;pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .12s ease-out;will-change:transform}#__nolli_cursor svg{display:block;transition:transform .08s ease-out;transform-origin:2px 2px}#__nolli_cursor.__pressed svg{transform:scale(.82)}';
    el = document.createElement('div');
    el.id = '__nolli_cursor';
    el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.55))"><path d="M2 2 L2 18 L7.5 14 L11 22 L14 21 L10.5 13 L16 13 Z" fill="#fff" stroke="rgba(0,0,0,.5)" stroke-width="1" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(style);
    document.documentElement.appendChild(el);
  };
  const setPos = (x, y) => { if (el) el.style.transform = 'translate3d(' + (x - 2) + 'px,' + (y - 2) + 'px,0)'; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure, { once: true });
  else ensure();
  // During a map panBy, mirror the cursor to the map's REAL per-frame content
  // offset (project(centerAtPanStart) read each rAF), so the cursor is locked to
  // the pan exactly — same easing, no Node/CDP drift. rAF + setTimeout here are
  // the CLOCK_INIT-slowed variants, so this stays on the capture's app-time
  // clock in lockstep with MapLibre's own rAF-driven pan. Resolves on moveend
  // (or a safety timeout) with the final pixel offset so the caller can update
  // its Node-side cursor coordinate.
  window.__nolliCursorFollow = (sx, sy) => new Promise((resolve) => {
    const m = window.__nolliMap;
    const e = document.getElementById('__nolli_cursor');
    if (!m || !e || !m.getCenter || !m.project) return resolve({ fx: 0, fy: 0 });
    const c0 = m.getCenter();
    const p0 = m.project([c0.lng, c0.lat]);
    e.style.opacity = '1';
    let done = false;
    const place = () => {
      const p = m.project([c0.lng, c0.lat]);
      e.style.transform = 'translate3d(' + (sx + (p.x - p0.x) - 2) + 'px,' + (sy + (p.y - p0.y) - 2) + 'px,0)';
    };
    const finish = () => {
      if (done) return; done = true; place();
      const p = m.project([c0.lng, c0.lat]);
      resolve({ fx: p.x - p0.x, fy: p.y - p0.y });
    };
    const loop = () => { if (done) return; place(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    if (m.once) m.once('moveend', finish);
    setTimeout(finish, 4000);
  });
  window.addEventListener('pointermove', (e) => { ensure(); if (el) { el.style.opacity = '1'; setPos(e.clientX, e.clientY); } }, { capture: true });
  window.addEventListener('pointerdown', (e) => { ensure(); if (el) { el.classList.add('__pressed'); setPos(e.clientX, e.clientY); } }, { capture: true });
  window.addEventListener('pointerup', () => { if (el) el.classList.remove('__pressed'); }, { capture: true });
})();
`;

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
  const _st = window.setTimeout, _si = window.setInterval;
  window.setTimeout = (cb, ms, ...a) => _st(cb, (ms ?? 0) / f(), ...a);
  window.setInterval = (cb, ms, ...a) => _si(cb, (ms ?? 0) / f(), ...a);
})();
`;

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

type CaptureMap = { isMoving: () => boolean };

// Wait for the in-flight camera move (`easeTo`/`panBy`, issued via
// `window.__nolliMap` under `?capture=1`) to reach moveend.
export async function waitForMapMoveEnd(page: Page, timeoutMs = 6000) {
  await page
    .waitForFunction(
      () => {
        const m = (window as unknown as { __nolliMap?: CaptureMap }).__nolliMap;
        return !m || !m.isMoving();
      },
      undefined,
      { timeout: timeoutMs },
    )
    .catch(() => {});
}

// Node-side poll (real wall-time) for MapLibre tile-readiness.
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

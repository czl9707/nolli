import type { Locator, Page } from "playwright";
import { path } from "ghost-cursor";
import type { NolliCaptureMap } from "./page-ops";

// Local mirror of ghost-cursor's Vector/TimedVector/BoundingBox shapes — defined
// here so this module's types don't pull in ghost-cursor's puppeteer-typed .d.ts.
type Vec = { x: number; y: number };
type TimedVec = Vec & { timestamp: number };
type Box = { x: number; y: number; width: number; height: number };

export type CursorOptions = {
  // The capture slow-mo factor. Every app-ms of motion is waited as appMs/slowmo
  // wall-ms, matching assets-demo's appWait so the cursor moves in the same
  // (slowed) time-frame as the app's animations.
  slowmo: number;
  viewport: { width: number; height: number };
  // click(): app-ms to hover at the cursor's spot before pressing — the
  // "I'm here" beat the viewer needs to read the click.
  hoverAppMs: number;
  // click(): app-ms to settle after releasing.
  dwellAppMs: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// A point near the center of a box, jittered within ~25% so the click target
// varies a little run-to-run but always lands safely inside the element. We use
// center (not ghost-cursor's random interior) because the click must hit the
// element even when it's CSS-rotated — and a rotated element's axis-aligned
// bounding-box center is its true center.
const centerOf = (b: Box): Vec => {
  const jx = (Math.random() * 2 - 1) * b.width * 0.25;
  const jy = (Math.random() * 2 - 1) * b.height * 0.25;
  return { x: b.x + b.width / 2 + jx, y: b.y + b.height / 2 + jy };
};

// Resolve a Locator to a near-center point in its bounding box. Retries once
// after waiting for visible (some targets — a just-bloomed polaroid — aren't
// laid out the instant we ask); falls back to viewport center only if it never
// materializes.
export async function pointOf(
  locator: Locator,
  viewport: { width: number; height: number },
): Promise<Vec> {
  let box = await locator.boundingBox();
  if (!box) {
    await locator.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    box = await locator.boundingBox();
  }
  return box
    ? centerOf(box)
    : { x: viewport.width / 2, y: viewport.height / 2 };
}

// Page-side half of the cursor: a purely-presentational overlay so the pointer
// is visible in the CDP screencast (headless Chromium never composites the
// native OS cursor, so clicks/drags would otherwise be invisible on camera).
// pointer-events:none, hidden until the first pointermove. All motion comes
// from real page.mouse events — this element just follows them — so hover
// states are untouched. Press feedback (a small shrink toward the tip) fires
// on pointerdown/up.
//
// The element is appended to documentElement on DOMContentLoaded (NOT at
// document_start): addInitScript runs before the HTML parser finishes, and any
// nodes appended then are discarded when the parser rebuilds the tree. The
// window-level listeners are installed immediately (window is stable across the
// parse) and lazily create the element on the first pointermove as a fallback.
//
// Also installs window.__nolliCursorFollow — the pan-follow protocol dragMap()
// consumes: during a map panBy it mirrors the cursor to the map's REAL
// per-frame content offset (project(centerAtPanStart) read each rAF), so the
// cursor is locked to the pan exactly — same easing, no Node/CDP drift. rAF +
// setTimeout here are the CLOCK_INIT-slowed variants, so this stays on the
// capture's app-time clock in lockstep with MapLibre's own rAF-driven pan.
// Resolves on moveend (or a safety timeout) with the final pixel offset so the
// caller can update its Node-side cursor coordinate.
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

export function createCursor(page: Page, opts: CursorOptions) {
  const { slowmo, viewport, hoverAppMs, dwellAppMs } = opts;
  let cur: Vec = { x: viewport.width / 2, y: viewport.height / 2 };
  const wall = (appMs: number) => appMs / slowmo;

  // Points carry ghost-cursor's natural slow-fast-slow timing, rescaled to a
  // deterministic appMs span. SUBSAMPLED to <= MAX_PATH_POINTS: each
  // page.mouse.move is a CDP round-trip (~7ms wall), and ghost-cursor emits
  // 20-50 points even for short moves — stepping all of them inflates the real
  // app-time far past `appMs`. 8 points is well above per-frame density at
  // capture rate, so it stays smooth without the CDP tax.
  async function runPath(pts: TimedVec[], appMs: number, end: Vec): Promise<Vec> {
    if (pts.length === 0) return end;
    const MAX_PATH_POINTS = 8;
    const stride = Math.ceil(pts.length / MAX_PATH_POINTS);
    const steps =
      stride <= 1 ? pts : pts.filter((_, i) => i % stride === 0 || i === pts.length - 1);
    const first = steps[0].timestamp;
    const span = steps[steps.length - 1].timestamp - first || 1;
    let prev = first;
    for (const p of steps) {
      const dt = p.timestamp - prev;
      prev = p.timestamp;
      await page.mouse.move(clamp(p.x, 0, viewport.width), clamp(p.y, 0, viewport.height));
      await page.waitForTimeout(wall((dt * appMs) / span));
    }
    return { x: clamp(end.x, 0, viewport.width), y: clamp(end.y, 0, viewport.height) };
  }

  async function move(point: Vec, appMs: number): Promise<void> {
    const pts = path(cur, point, { useTimestamps: true }) as TimedVec[];
    cur = await runPath(pts, appMs, point);
  }

  // Callers pair it with move(): one decisive move onto the target, then
  // click — without the hover beat the press reads as barely grazing the
  // target before the action fires.
  async function click(): Promise<void> {
    await page.waitForTimeout(wall(hoverAppMs));
    await page.mouse.click(cur.x, cur.y);
    await page.waitForTimeout(wall(dwellAppMs));
  }

  // Pressless camera drag: the map pans itself by (point − cur) and the cursor
  // rides along via an in-page rAF loop (window.__nolliCursorFollow, installed
  // by CURSOR_INIT) that reads the map's real per-frame content offset, so the
  // cursor locks to whatever easing MapLibre uses — no Node/CDP drift. Resolves
  // on moveend, then folds the final pixel offset into cur so the next move is
  // continuous. No synthetic pointer: a pointerdown on the map would start a
  // real map drag fighting the panBy.
  async function dragMap(point: Vec, appMs: number): Promise<void> {
    await page.evaluate(
      ({ dx, dy, duration }) => {
        const m = (window as unknown as { __nolliMap?: Pick<NolliCaptureMap, "panBy"> }).__nolliMap;
        m?.panBy([dx, dy], { duration });
      },
      { dx: point.x - cur.x, dy: point.y - cur.y, duration: appMs },
    );
    const off = await page.evaluate(
      (s) =>
        (window as unknown as {
          __nolliCursorFollow?: (x: number, y: number) => Promise<{ fx: number; fy: number }>;
        }).__nolliCursorFollow?.(s.x, s.y) ?? Promise.resolve({ fx: 0, fy: 0 }),
      cur,
    );
    cur = {
      x: clamp(cur.x + off.fx, 0, viewport.width),
      y: clamp(cur.y + off.fy, 0, viewport.height),
    };
  }

  // A small, human-like reposition just before a drag — the hand settling on
  // the map. A random point in the central region, NOT an offset from the
  // current cursor (after a pan it can sit near an edge, and a ±offset would
  // wander it off the map). Guarantees a minimum travel so it reads as a move
  // rather than a twitch, and scales duration by distance so short reaches
  // aren't slow crawls.
  async function reposition(): Promise<void> {
    let tx = viewport.width * (0.3 + Math.random() * 0.4);
    let ty = viewport.height * (0.3 + Math.random() * 0.4);
    const dx = tx - cur.x;
    const dy = ty - cur.y;
    let dist = Math.hypot(dx, dy);
    const minDist = 130;
    if (dist < minDist) {
      const k = dist > 0.1 ? minDist / dist : 1;
      tx = clamp(cur.x + dx * k, viewport.width * 0.25, viewport.width * 0.75);
      ty = clamp(cur.y + dy * k, viewport.height * 0.25, viewport.height * 0.75);
      dist = Math.hypot(tx - cur.x, ty - cur.y);
    }
    await move({ x: tx, y: ty }, clamp(dist / 1.8, 70, 120));
  }

  // The overlay is hidden until the first pointermove — a single move reveals
  // it. No path, no glide-in (that read as a bad initial move).
  async function appear(): Promise<void> {
    const c = { x: viewport.width / 2, y: viewport.height / 2 };
    await page.mouse.move(c.x, c.y);
    cur = c;
  }

  return {
    appear,
    reposition,
    move,
    click,
    dragMap,
    // Read-only current position (callers compute drag endpoints as pos+delta).
    pos: () => ({ ...cur }) as Readonly<Vec>,
  };
}

export type Cursor = ReturnType<typeof createCursor>;

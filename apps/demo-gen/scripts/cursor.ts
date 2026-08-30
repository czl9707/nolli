import type { Locator, Page } from "playwright";
// ghost-cursor's `path` is pure math (Bézier + Fitts's-law point density +
// overshoot). We drive page.mouse ourselves so motion stays on the capture's
// slow-mo app-time clock. (Its GhostCursor class + installMouseHelper are
// Puppeteer-coupled and don't fit our Playwright/CDP-screencast pipeline.)
import { path } from "ghost-cursor";

// Local mirror of ghost-cursor's Vector/TimedVector/BoundingBox shapes — defined
// here so this module's types don't pull in ghost-cursor's puppeteer-typed .d.ts.
type Vec = { x: number; y: number };
type TimedVec = Vec & { timestamp: number };
type Box = { x: number; y: number; width: number; height: number };

export type CursorTarget = Locator | Vec;

export type CursorOptions = {
  // The capture slow-mo factor. Every app-ms of motion is waited as appMs/slowmo
  // wall-ms, matching assets-demo's appWait so the cursor moves in the same
  // (slowed) time-frame as the app's animations.
  slowmo: number;
  // Viewport in CSS px (for clamping + center fallback).
  viewport: { width: number; height: number };
};

export type CursorTiming = {
  /** app-ms for the approach to a click target. */
  moveAppMs?: number;
  /** app-ms to hover on the target before pressing — the "arrive" beat. */
  hoverAppMs?: number;
  /** app-ms to settle after releasing. */
  dwellAppMs?: number;
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

export function createCursor(page: Page, opts: CursorOptions) {
  const { slowmo, viewport } = opts;
  // Start at screen center — the cursor is revealed there by appear() at capture
  // start (no glide-in; that read as a bad initial move).
  let cur: Vec = { x: viewport.width / 2, y: viewport.height / 2 };
  const wall = (appMs: number) => appMs / slowmo;

  // Step a pre-computed path, dispatching a real pointermove per point (the
  // in-page overlay follows these). Points carry ghost-cursor's natural timing;
  // we rescale the whole span to `appMs` of app-time so the move lands on a
  // deterministic duration while preserving its slow-fast-slow speed curve.
  //
  // The path is SUBSAMPLED to <= MAX_PATH_POINTS: each page.mouse.move is a CDP
  // round-trip (~7ms wall), and ghost-cursor emits 20-50 points even for short
  // moves — stepping all of them inflates the real app-time far past `appMs`.
  // ~12 points is well above per-frame density at capture rate, so it stays
  // smooth without the CDP tax.
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
      const x = clamp(p.x, 0, viewport.width);
      const y = clamp(p.y, 0, viewport.height);
      await page.mouse.move(x, y);
      await page.waitForTimeout(wall((dt * appMs) / span));
    }
    return { x: clamp(end.x, 0, viewport.width), y: clamp(end.y, 0, viewport.height) };
  }

  // Build a timed path from `cur` to `end` (a point or an element box).
  function plan(end: Vec | Box): { pts: TimedVec[]; land: Vec } {
    const pts = path(cur, end, { useTimestamps: true }) as TimedVec[];
    // For a box target, ghost-cursor ends inside it — use the last point as the
    // landing coordinate so a subsequent click lands where the viewer saw the
    // cursor arrive. For a point target, snap to the exact point.
    const last = pts[pts.length - 1];
    const land: Vec =
      "width" in end ? { x: last.x, y: last.y } : { x: (end as Vec).x, y: (end as Vec).y };
    return { pts, land };
  }

  async function moveTo(end: Vec | Box, appMs: number): Promise<Vec> {
    const { pts, land } = plan(end);
    const arrived = await runPath(pts, appMs, land);
    cur = arrived;
    return arrived;
  }

  // Resolve a target (Locator → a near-center point in its bounding box, or a
  // literal point) to a ghost-cursor end. Retries once after waiting for visible
  // (some targets — a just-bloomed polaroid — aren't laid out the instant we
  // ask); falls back to viewport center only if it never materializes.
  async function resolve(target: CursorTarget): Promise<Vec> {
    if ("x" in target && "y" in target) return target as Vec;
    const loc = target as Locator;
    let box = await loc.boundingBox();
    if (!box) {
      await loc.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
      box = await loc.boundingBox();
    }
    return box ? centerOf(box) : { x: viewport.width / 2, y: viewport.height / 2 };
  }

  async function pointAt(target: CursorTarget, t: CursorTiming = {}): Promise<Vec> {
    return moveTo(await resolve(target), t.moveAppMs ?? 260);
  }

  // Approach → HOVER (the "I'm here" beat the viewer needs to read the click) →
  // press → release. The hover is the important part: without it the cursor
  // seems to barely graze the target before the action fires.
  async function click(target: CursorTarget, t: CursorTiming = {}): Promise<void> {
    const hover = t.hoverAppMs ?? 220;
    const dwell = t.dwellAppMs ?? 110;
    const land = await pointAt(target, t);
    await page.waitForTimeout(wall(hover));
    await page.mouse.click(land.x, land.y);
    await page.waitForTimeout(wall(dwell));
  }

  // Button-held move (one segment of a drag). Caller owns down()/up() so it can
  // keep the React isPanning-commit settle between them (see panBoard).
  async function drag(to: Vec, appMs: number): Promise<void> {
    await moveTo(to, appMs);
  }

  // Mirror a map panBy to the cursor with perfect sync: an in-page rAF loop
  // (installed by CURSOR_INIT as window.__nolliCursorFollow) reads the map's real
  // per-frame content offset and sets the overlay transform directly, so the
  // cursor locks to whatever easing MapLibre uses — no Node/CDP drift. Resolves on
  // moveend; we then fold the final pixel offset into our Node-side coordinate so
  // the next move is continuous.
  async function followPan(): Promise<void> {
    const start = { x: cur.x, y: cur.y };
    const off = await page.evaluate(
      (s) =>
        (window as unknown as {
          __nolliCursorFollow?: (x: number, y: number) => Promise<{ fx: number; fy: number }>;
        }).__nolliCursorFollow?.(s.x, s.y) ?? Promise.resolve({ fx: 0, fy: 0 }),
      start,
    );
    cur = { x: clamp(cur.x + off.fx, 0, viewport.width), y: clamp(cur.y + off.fy, 0, viewport.height) };
  }

  // A small, human-like reposition just before a drag — the hand settling on the
  // map. Picks a random point in the central region of the viewport (NOT an
  // offset from the current cursor: after a pan the cursor can sit near an edge,
  // and a random ±offset would wander it off the map). Two extras vs a plain
  // moveTo: (1) guarantee a meaningful travel distance so it reads as a move, not
  // a twitch; (2) scale the duration by distance so a SHORT reposition is quick
  // instead of a fixed slow crawl (the first reach, from center, was the victim).
  async function reach(): Promise<void> {
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
    const appMs = clamp(dist / 1.8, 70, 120);
    await moveTo({ x: tx, y: ty }, appMs);
  }

  // Reveal the cursor at screen center at capture start (a single pointermove —
  // the overlay is hidden until the first move). No path, no animation.
  async function appear(): Promise<void> {
    const c = { x: viewport.width / 2, y: viewport.height / 2 };
    await page.mouse.move(c.x, c.y);
    cur = c;
  }

  // Hide the cursor before the final still so demo-end.png has no pointer. The
  // mouse itself can't leave the viewport (CDP clamps pointer coords to it), so
  // we glide to the nearest edge and fade the overlay element out directly.
  async function exit(appMs = 450): Promise<void> {
    const edge = { x: clamp(cur.x, 0, viewport.width), y: clamp(cur.y, 0, viewport.height) };
    const target = { x: edge.x < viewport.width / 2 ? 0 : viewport.width, y: edge.y };
    await moveTo(target, appMs);
    await page.evaluate(() => {
      const el = document.getElementById("__nolli_cursor");
      if (el) el.style.opacity = "0";
    });
  }

  return { moveTo, pointAt, click, drag, followPan, reach, appear, exit, location: () => cur };
}

export type Cursor = ReturnType<typeof createCursor>;

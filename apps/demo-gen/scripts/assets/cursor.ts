import type { Locator, Page } from "playwright";
import { path } from "ghost-cursor";

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
  // Viewport in CSS px (for clamping + center fallback).
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

export function createCursor(page: Page, opts: CursorOptions) {
  const { slowmo, viewport, hoverAppMs, dwellAppMs } = opts;
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
  // 8 points is well above per-frame density at capture rate, so it stays
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
      await page.mouse.move(clamp(p.x, 0, viewport.width), clamp(p.y, 0, viewport.height));
      await page.waitForTimeout(wall((dt * appMs) / span));
    }
    return { x: clamp(end.x, 0, viewport.width), y: clamp(end.y, 0, viewport.height) };
  }

  // Ghost-cursor Bézier from cur to `point`, landed exactly on it.
  async function move(point: Vec, appMs: number): Promise<void> {
    const pts = path(cur, point, { useTimestamps: true }) as TimedVec[];
    cur = await runPath(pts, appMs, point);
  }

  // Press/release at the current spot, with the hover beat before and dwell
  // after. Callers pair it with move(): one decisive move onto the target,
  // then click — without the hover the cursor seems to barely graze the target
  // before the action fires.
  async function click(): Promise<void> {
    await page.waitForTimeout(wall(hoverAppMs));
    await page.mouse.click(cur.x, cur.y);
    await page.waitForTimeout(wall(dwellAppMs));
  }

  // One gesture, two drags:
  // - map mode (map=true): pressless camera drag. The map pans itself by
  //   (point − cur) and the cursor rides along via an in-page rAF loop
  //   (window.__nolliCursorFollow, installed by CURSOR_INIT) that reads the
  //   map's real per-frame content offset, so the cursor locks to whatever
  //   easing MapLibre uses — no Node/CDP drift. Resolves on moveend, then folds
  //   the final pixel offset into cur so the next move is continuous. No
  //   synthetic pointer: a pointerdown on the map would start a real map drag
  //   fighting the panBy.
  // - pointer mode: a real held-button drag — down, a settle so React commits
  //   isPanning (board pans gate pointermove on it; Playwright's batched mouse
  //   moves can all land before the commit, leaving every move a no-op), a
  //   ghost-cursor Bézier to `point`, then up.
  async function drag(point: Vec, appMs: number, map?: boolean): Promise<void> {
    if (map) {
      await page.evaluate(
        ({ dx, dy, duration }) => {
          const m = (window as unknown as {
            __nolliMap?: { panBy: (off: [number, number], o: { duration: number }) => void };
          }).__nolliMap;
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
      return;
    }
    await page.mouse.down();
    await page.waitForTimeout(wall(150));
    await move(point, appMs);
    await page.mouse.up();
  }

  // A small, human-like reposition just before a drag — the hand settling on the
  // map. Picks a random point in the central region of the viewport (NOT an
  // offset from the current cursor: after a pan the cursor can sit near an edge,
  // and a random ±offset would wander it off the map). Two extras vs a plain
  // move: (1) guarantee a meaningful travel distance so it reads as a move, not
  // a twitch; (2) scale the duration by distance so a SHORT reposition is quick
  // instead of a fixed slow crawl (the first reach, from center, was the victim).
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

  // Reveal the cursor at screen center at capture start (a single pointermove —
  // the overlay is hidden until the first move). No path, no animation.
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
    drag,
    // Read-only current position (callers compute drag endpoints as pos+delta).
    pos: () => ({ ...cur }) as Readonly<Vec>,
  };
}

export type Cursor = ReturnType<typeof createCursor>;

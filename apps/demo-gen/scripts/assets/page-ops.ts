import type { Browser, Locator, Page } from "playwright";
import {
  BASE_URL,
  BOARD_PHOTO,
  applyBrowserCaptureContext,
  waitForToastDisappear,
} from "./capture-helpers";
import type { Cursor } from "./cursor";
import type { BuildingRow } from "../seed/manifest";
import { JOURNEY, appWait, VIEWPORT, CAPTURE_SCALE } from "./tuning";

// ── Page operations ─────────────────────────────────────────────────────────
// Everything here drives the real app — through the capture bridges
// (?capture=1 → window.__nolliMap / window.__nolliNavigateArch) or synthetic
// pointer input. The narrative sequencing these ops lives in assets-demo.ts.

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

// The map handle MapCaptureBridge exposes under ?capture=1 — the structural
// type every in-page evaluate shim casts window.__nolliMap to (shims declare
// only the members they touch via Pick). The app side assigns the whole live
// MapLibre instance, so this describes the used subset, not a wrapper.
export type NolliCaptureMap = {
  getZoom: () => number;
  getCenter: () => { lng: number; lat: number };
  getBounds: () => { contains: (p: [number, number]) => boolean };
  stop: () => void;
  flyTo: (o: {
    center: [number, number];
    zoom: number;
    duration: number;
    curve: number;
    speed: number;
    essential: boolean;
  }) => void;
  panBy: (off: [number, number], o: { duration: number }) => void;
  jumpTo: (o: { center: [number, number]; zoom: number }) => void;
  project?: (lngLat: [number, number]) => { x: number; y: number };
  isMoving: () => boolean;
  areTilesLoaded: () => boolean;
};

// ── Camera ──────────────────────────────────────────────────────────────────

export const cam = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap;
    if (!m) return null;
    const c = m.getCenter();
    return { zoom: m.getZoom(), lng: c.lng, lat: c.lat };
  });

// Flip the page's slow-mo factor in place — board beats that drive real
// pointer drags run at __SLOWMO=1 (see panBoardAround's header for why) and
// restore the journey factor in a finally. Exported for narrative scripts
// that hold the realtime clock across a whole beat (e.g. the board→map exit,
// whose morph writes don't flush under the slowed clock either).
export const setSlowmo = (page: Page, factor: number) =>
  page.evaluate(
    (v) => {
      (window as unknown as { __SLOWMO?: number }).__SLOWMO = v;
    },
    factor,
  );

const mapCenter = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap;
    const c = m?.getCenter();
    return c ? { lng: c.lng, lat: c.lat } : { lng: NaN, lat: NaN };
  });

// Project an arch's coord to screen px via the live map (to aim the return pan).
const pinScreen = (page: Page, lng: number, lat: number) =>
  page.evaluate(
    ({ lng, lat }) => {
      const m = (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap;
      const p = m?.project?.([lng, lat]);
      return p ? { x: p.x, y: p.y } : null;
    },
    { lng, lat },
  );

// ── Session setup ───────────────────────────────────────────────────────────

// ?capture=1 gates MapCaptureBridge → window.__nolliMap and preserves the
// drawing buffer for the screencast — fail fast if it didn't run.
export async function setupPageForCapture(browser: Browser, start: BuildingRow) {
  const context = await applyBrowserCaptureContext(browser, {
    viewport: VIEWPORT,
    deviceScaleFactor: CAPTURE_SCALE,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/arch/${start.slug}?capture=1`);
  await waitForToastDisappear(page);
  const hasMap = await page.evaluate(
    () => !!(window as unknown as { __nolliMap?: unknown }).__nolliMap,
  );
  if (!hasMap) {
    throw new Error(
      "window.__nolliMap not found — MapCaptureBridge didn't run. Is ?capture=1 present and the map loaded?",
    );
  }
  return { context, page };
}

// Flip the whole app (MapLibre camera + framer-motion) into slow-mo for capture.
export async function flipSlowmo(page: Page) {
  await page.evaluate(
    (s) => {
      (window as unknown as { __SLOWMO?: number }).__SLOWMO = s;
    },
    JOURNEY.slowmo,
  );
}

// ── Pans ────────────────────────────────────────────────────────────────────

// Build a pan (dx, dy, dur) from a base angle + a ±fanHalf spread, with random
// magnitude/duration. Used by the map look-around: pan 1 glances OUT away from
// the pin (wide fan), pan 2 glances BACK toward the pin (narrow fan); a zero
// fan with a random base is the undirected fallback when the pin can't frame
// the pan.
const panFromAngle = (base: number, fanHalfDeg: number): { dx: number; dy: number; dur: number } => {
  const angle = base + (Math.random() - 0.5) * 2 * ((fanHalfDeg * Math.PI) / 180);
  const mag = rand(JOURNEY.panMagMin, JOURNEY.panMagMax);
  return {
    dx: Math.round(Math.cos(angle) * mag),
    dy: Math.round(Math.sin(angle) * mag),
    dur: Math.round(rand(JOURNEY.panDurMin, JOURNEY.panDurMax)),
  };
};

const randomPan = (): { dx: number; dy: number; dur: number } =>
  panFromAngle(Math.random() * Math.PI * 2, 0);

// `mapPanCount` "look around" pans around the target pin — a human out-and-back
// glance. Pan 1 glances OUT, away from the pin (wide fan → "some direction" but
// reliably outward); pan 2 glances BACK toward the pin within a narrow fan. The
// pin's home is offset from viewport center (the selection panel shifts the map's
// effective center), so "away from the pin" on pan 1 is what guarantees the two
// pans differ — aiming pan 1 at the pin would send both the same way. Asserts
// per-pan movement (getCenter before/after) so a silent no-op pan fails.
export async function panMapAround(
  page: Page,
  cursor: Cursor,
  target: { longitude: number; latitude: number },
) {
  for (let i = 0; i < JOURNEY.mapPanCount; i++) {
    const pin = await pinScreen(page, target.longitude, target.latitude);
    let p: { dx: number; dy: number; dur: number };
    let intent: string;
    if (!pin) {
      p = randomPan();
      intent = "random (pin unavailable)";
    } else {
      const offX = pin.x - VIEWPORT.width / 2;
      const offY = pin.y - VIEWPORT.height / 2;
      if (Math.hypot(offX, offY) < 8) {
        p = randomPan();
        intent = "random (pin centered)";
      } else if (i === 0) {
        // Pan 1: glance OUT away from the pin — wide fan so the outbound
        // direction varies run-to-run instead of mirroring the return axis.
        p = panFromAngle(Math.atan2(-offY, -offX), JOURNEY.panOutFanHalf);
        intent = "OUT away from pin";
      } else {
        p = panFromAngle(Math.atan2(offY, offX), JOURNEY.panFanHalf); // toward pin
        intent = "BACK toward pin";
      }
      console.log(
        `    pin off=(${signed(Math.round(offX))},${signed(Math.round(offY))}) → ${intent}`,
      );
    }
    const before = await mapCenter(page);
    console.log(
      `    map pan ${i + 1}/${JOURNEY.mapPanCount} dx=${signed(p.dx)} dy=${signed(p.dy)}` +
        ` (center=${before.lng.toFixed(3)},${before.lat.toFixed(3)})`,
    );
    // Ride the pan through the middle: start the cursor at center + pan/2 so
    // the content-follow (which shifts the cursor by −pan over the pan) sweeps
    // it through the viewport center, landing at center − pan/2. It never
    // strays more than half a pan from the middle; a drag started wherever the
    // cursor happened to sit parks it a full pan-length off to one side.
    const half = { x: p.dx / 2, y: p.dy / 2 };
    const start = {
      x: Math.max(VIEWPORT.width * 0.2, Math.min(VIEWPORT.width * 0.8, VIEWPORT.width / 2 + half.x)),
      y: Math.max(VIEWPORT.height * 0.2, Math.min(VIEWPORT.height * 0.8, VIEWPORT.height / 2 + half.y)),
    };
    const dist = Math.hypot(start.x - cursor.pos().x, start.y - cursor.pos().y);
    await cursor.move(start, Math.max(70, Math.min(120, dist / 1.8)));
    await cursor.dragMap({ x: start.x + p.dx, y: start.y + p.dy }, p.dur);
    const after = await mapCenter(page);
    if (
      !Number.isNaN(before.lng) &&
      Math.abs(after.lng - before.lng) < 1e-6 &&
      Math.abs(after.lat - before.lat) < 1e-6
    ) {
      throw new Error("Map pan produced no movement — panBy didn't take.");
    }
    await appWait(page, JOURNEY.panHold);
  }
}

// Board look-around: the out-and-back glance panMapAround gives the map, as two
// real-pointer drags on the board viewport (useBoardPan pans on native pointer
// events — there is no panBy to drive). The surface (2400×1500) is larger than
// the viewport (1920×1080), so a diagonal drag has travel in both directions.
// Drag >3px suppresses item clicks and the map inset is covered by its overlay
// in board mode, so the drag pans the board from anywhere. Movement is asserted
// via a photo's screen box — the pan shifts every item, so a static box means
// the drag was swallowed.
//
// The whole beat runs at __SLOWMO=1: framer-motion never flushes the pan
// MotionValue's DOM write per-pointermove under the slowed clock (the transform
// sits at its pre-drag value until the pointerup re-render — the board
// "teleports" instead of panning). At real time it writes per-move, and the
// cursor helpers' wall-time pacing (appMs/slowmo) already stretches the drag to
// slowmo-equivalent wall duration, so the clip's pacing is unchanged.
export async function panBoardAround(page: Page, cursor: Cursor) {
  await setSlowmo(page, 1);
  try {
    const witness = page.locator(BOARD_PHOTO).first();
    // Leg 1 heads out on the NEGATIVE diagonal and leg 2 returns: clampPan's
    // window is [viewport−canvas−pad, +pad] ≈ [-680, 200] / [-620, 200] from
    // the board's home, so the negative side has the most room.
    for (const [i, sign] of [-1, 1].entries()) {
      const dx = Math.round(sign * JOURNEY.boardPanMag * 0.7);
      const dy = Math.round(sign * JOURNEY.boardPanMag * 0.45);
      const half = { x: dx / 2, y: dy / 2 };
      const start = {
        x: Math.max(VIEWPORT.width * 0.25, Math.min(VIEWPORT.width * 0.7, VIEWPORT.width / 2 + half.x)),
        y: Math.max(VIEWPORT.height * 0.25, Math.min(VIEWPORT.height * 0.7, VIEWPORT.height / 2 + half.y)),
      };
      const dist = Math.hypot(start.x - cursor.pos().x, start.y - cursor.pos().y);
      await cursor.move(start, Math.max(70, Math.min(120, dist / 1.8)));
      const before = await witness.boundingBox();
      await cursor.drag({ x: start.x + dx, y: start.y + dy }, JOURNEY.boardPanDur);
      const after = await witness.boundingBox();
      if (before && after && Math.hypot(after.x - before.x, after.y - before.y) < 5) {
        throw new Error("Board pan produced no movement — drag was swallowed.");
      }
      console.log(
        `    board pan leg ${i + 1} dx=${signed(dx)} dy=${signed(dy)}` +
          ` (witness Δ=(${signed(Math.round((after?.x ?? 0) - (before?.x ?? 0)))},${signed(Math.round((after?.y ?? 0) - (before?.y ?? 0)))}))`,
      );
      await page.waitForTimeout(JOURNEY.boardPanHold / JOURNEY.slowmo);
    }
  } finally {
    await setSlowmo(page, JOURNEY.slowmo);
  }
}

// Single-leg board pan TOWARD a target photo: the drag delta is
// center − photo-center (the surface follows the pointer, so the photo lands
// near the viewport middle), magnitude clamped to boardPanToMag so a distant
// photo doesn't slam into the clamp window at full stretch. Same __SLOWMO=1
// requirement and witness-assert as panBoardAround.
export async function panBoardTo(page: Page, cursor: Cursor, photo: Locator) {
  await setSlowmo(page, 1);
  try {
    const box = await photo.boundingBox();
    if (!box) throw new Error("panBoardTo: target photo not visible.");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    let dx = VIEWPORT.width / 2 - cx;
    let dy = VIEWPORT.height / 2 - cy;
    const mag = Math.hypot(dx, dy);
    if (mag > JOURNEY.boardPanToMag) {
      dx = (dx / mag) * JOURNEY.boardPanToMag;
      dy = (dy / mag) * JOURNEY.boardPanToMag;
    }
    const half = { x: dx / 2, y: dy / 2 };
    const start = {
      x: Math.max(VIEWPORT.width * 0.25, Math.min(VIEWPORT.width * 0.7, VIEWPORT.width / 2 - half.x)),
      y: Math.max(VIEWPORT.height * 0.25, Math.min(VIEWPORT.height * 0.7, VIEWPORT.height / 2 - half.y)),
    };
    const dist = Math.hypot(start.x - cursor.pos().x, start.y - cursor.pos().y);
    await cursor.move(start, Math.max(70, Math.min(120, dist / 1.8)));
    const before = await photo.boundingBox();
    await cursor.drag({ x: start.x + dx, y: start.y + dy }, JOURNEY.boardPanDur);
    const after = await photo.boundingBox();
    if (before && after && Math.hypot(after.x - before.x, after.y - before.y) < 5) {
      throw new Error("Board pan produced no movement — drag was swallowed.");
    }
    console.log(
      `    board pan-to dx=${signed(Math.round(dx))} dy=${signed(Math.round(dy))}` +
        ` (witness Δ=(${signed(Math.round((after?.x ?? 0) - (before?.x ?? 0)))},${signed(Math.round((after?.y ?? 0) - (before?.y ?? 0)))}))`,
    );
    await page.waitForTimeout(JOURNEY.boardPanHold / JOURNEY.slowmo);
  } finally {
    await setSlowmo(page, JOURNEY.slowmo);
  }
}

// Drag the board surface back to its home transform (pan 0,0) before leaving
// board mode. useBoardPan resets the pan with an imperative framer
// `animate(panX, 0)` on the mode flip — which never flushes its DOM write
// under the slowed clock (same class as panBoardAround's pointermove gotcha),
// so exiting with a live pan leaves the whole map view shifted by the pan
// offset until some later React render happens to flush it. Returning the pan
// with a real drag at __SLOWMO=1 first makes that reset a 0→0 no-op.
export async function panBoardReset(page: Page, cursor: Cursor) {
  await setSlowmo(page, 1);
  try {
    const readPan = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("div[class*='surface']");
        const m = new DOMMatrixReadOnly(el?.style.transform || "none");
        return { x: m.m41, y: m.m42 };
      });
    const pan = await readPan();
    if (Math.hypot(pan.x, pan.y) >= 5) {
      // The surface moves WITH the pointer, so canceling pan P needs a drag
      // delta of −P: start at center + P/2, drag to center − P/2.
      const start = { x: VIEWPORT.width / 2 + pan.x / 2, y: VIEWPORT.height / 2 + pan.y / 2 };
      await cursor.move(
        {
          x: Math.max(1, Math.min(VIEWPORT.width - 1, start.x)),
          y: Math.max(1, Math.min(VIEWPORT.height - 1, start.y)),
        },
        JOURNEY.boardPanDur,
      );
      await cursor.drag(
        {
          x: Math.max(1, Math.min(VIEWPORT.width - 1, start.x - pan.x)),
          y: Math.max(1, Math.min(VIEWPORT.height - 1, start.y - pan.y)),
        },
        JOURNEY.boardPanDur,
      );
    }
    const after = await readPan();
    if (Math.hypot(after.x, after.y) >= 5) {
      throw new Error(
        `Board pan reset missed — surface still at (${after.x.toFixed(0)},${after.y.toFixed(0)}).`,
      );
    }
    console.log(`    board pan reset (was (${pan.x.toFixed(0)},${pan.y.toFixed(0)}))`);
    await page.waitForTimeout(JOURNEY.boardPanHold / JOURNEY.slowmo);
  } finally {
    await setSlowmo(page, JOURNEY.slowmo);
  }
}

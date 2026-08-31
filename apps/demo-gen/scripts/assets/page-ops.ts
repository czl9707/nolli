import type { Browser, Page } from "playwright";
import { MAP_TRANSITION_SHORT, MAP_TRANSITION_LONG } from "@nolli/ui/constants";
import {
  LAUNCH_ARGS,
  applyBrowserCaptureContext,
  waitForToastDisappear,
  waitForTilesLoaded,
} from "./capture-helpers";
import type { Cursor } from "./cursor";
import type { BuildingRow } from "../seed/manifest";
import { JOURNEY, appWait, VIEWPORT } from "./tuning";

// ── Page operations ─────────────────────────────────────────────────────────
// Everything here drives the real app — through the capture bridges
// (?capture=1 → window.__nolliMap / window.__nolliNavigateArch) or synthetic
// pointer input (cursor + pan helpers). The narrative that sequences these ops
// lives in assets-demo.ts.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

// The map handle MapCaptureBridge exposes under ?capture=1 — the structural
// type every in-page evaluate shim casts window.__nolliMap to. (The cast is
// repeated per shim: evaluate callbacks serialize and run in the page, so they
// can't close over a Node-side accessor.)
type NolliCaptureMap = {
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
};

// ── Camera ──────────────────────────────────────────────────────────────────

// In-page camera primitive mirroring packages/map/src/map-flyto.ts
// (flyToArchCinematic), on the app's own transition constants.
export const flyTo = (page: Page, lat: number, lng: number, zoom: number) =>
  page.evaluate(
    ({ lat, lng, zoom, nearMs, farMs }) => {
      const m = (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap;
      if (!m) return;
      const dest = Math.max(m.getZoom(), zoom);
      const delta = dest - m.getZoom();
      const contains = m.getBounds().contains([lng, lat]);
      const duration = contains ? nearMs + delta * 200 : farMs;
      m.stop();
      m.flyTo({ center: [lng, lat], zoom: dest, duration, curve: 1.2, speed: 1.0, essential: true });
    },
    {
      lat,
      lng,
      zoom,
      nearMs: MAP_TRANSITION_SHORT * 1000,
      farMs: MAP_TRANSITION_LONG * 1000,
    },
  );

const cam = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap;
    if (!m) return null;
    const c = m.getCenter();
    return { zoom: m.getZoom(), lng: c.lng, lat: c.lat };
  });

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

// Set up the dark-mode capture page on the journey's first building and assert
// the map bridge exposed itself (?capture=1 gates MapCaptureBridge →
// window.__nolliMap, and preserves the drawing buffer for the screencast).
export async function setupPageForCapture(browser: Browser, start: BuildingRow) {
  const context = await applyBrowserCaptureContext(browser, {
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
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

// Warm both flyTo destinations' zoom at their centers BEFORE slow-mo, so each
// swoop snaps in instantly during capture. Jumps run at real time (setTimeout
// isn't patched) and are invisible (screencast hasn't started). Leaves the
// camera at the establishing zoom on the first building (the journey's start state).
export async function warmTiles(page: Page, start: BuildingRow, last: BuildingRow) {
  const jumpTo = (center: [number, number], zoom: number) =>
    page.evaluate(
      ({ center, zoom }) => {
        (window as unknown as { __nolliMap?: NolliCaptureMap }).__nolliMap?.jumpTo({ center, zoom });
      },
      { center, zoom },
    );
  for (const b of [start, last]) {
    await jumpTo([b.longitude, b.latitude], JOURNEY.visitZoom);
    await waitForTilesLoaded(page, 6000);
  }
  await jumpTo([start.longitude, start.latitude], JOURNEY.establishZoom);
  await waitForTilesLoaded(page, 6000);
  console.log("  tile warm done");
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

// ── Navigation ──────────────────────────────────────────────────────────────

// Real arch→arch navigation — the money shot. Same code path as clicking
// an "Also by" suggestion card (window.__nolliNavigateArch, exposed under
// ?capture=1): the URL changes, the sidebar (selection panel) updates to arch #2,
// and MapFlyNavigator flies. Reached via the real nav handler, not a synthetic
// flyTo, so this is exactly the inter-arch transition a user gets.
export async function navigateToArch(page: Page, target: BuildingRow, beat: (label: string) => void) {
  const hasNav = await page.evaluate(
    () => !!(window as unknown as { __nolliNavigateArch?: unknown }).__nolliNavigateArch,
  );
  if (!hasNav) {
    throw new Error("window.__nolliNavigateArch not found — ArchNavCaptureBridge didn't run.");
  }
  const camBeforeNav = await cam(page);
  beat(`nav trigger → ${target.slug} (from zoom ${camBeforeNav?.zoom} lng ${camBeforeNav?.lng.toFixed(3)})`);
  await page.evaluate(
    (slug) => {
      (window as unknown as { __nolliNavigateArch?: (s: string, fly?: boolean) => void }).__nolliNavigateArch?.(slug, true);
    },
    target.slug,
  );
  // Fixed wait for the off-screen fly (MAP_TRANSITION_LONG = 1800 app-ms) to land
  // + a short settle, then straight into the #2 map pan. Replaces a variable
  // waitForMapMoveEnd (which resolved unpredictably because `select` is async, so
  // isMoving() was already false at the first poll) plus a dead hold.
  await appWait(page, JOURNEY.navLandMs);
  const camAfterNav = await cam(page);
  beat(
    `navLandMs done (zoom ${camAfterNav?.zoom} lng ${camAfterNav?.lng.toFixed(3)}, ` +
      `Δlng ${((camAfterNav?.lng ?? 0) - (camBeforeNav?.lng ?? 0)).toFixed(3)})`,
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

// A fully random drift-pan (no direction bias).
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
    // A small random hand-settling move — looks like a person reaching for the
    // map — then the pan as a map-mode drag: panBy + cursor riding the map's
    // real per-frame offset, resolving on moveend (which also waits out the pan).
    await cursor.reposition();
    const at = cursor.pos();
    await cursor.drag({ x: at.x + p.dx, y: at.y + p.dy }, p.dur, true);
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

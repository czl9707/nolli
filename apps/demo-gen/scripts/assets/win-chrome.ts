import { spawn, execSync } from "node:child_process";
import type { Browser } from "playwright";
import { chromium } from "playwright";

// Windows-Chrome capture host. The WSL Chromium rasterizes via SwiftShader
// (no hardware Vulkan ICD in WSL), which starves the CDP screencast to ~2fps
// and judders the demo clip, so capture always runs on Windows Chrome (real
// GPU): launched over WSL interop, driven via CDP through the host-side
// portproxy (netsh, scoped to the WSL-facing IP — one-time setup, see README).
// Everything downstream (contexts, viewport/DSF emulation, screencast, cursor)
// is plain Playwright/CDP and works unchanged over the connection.
const WIN_CHROME_EXE = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe";
const CDP_PORT = 9333;
const WIN_USER_DATA_DIR = "C:\\Temp\\nolli-capture-chrome";

const wslGatewayIp = (): string => {
  const out = execSync("ip route show default").toString();
  const m = /default via (\d+\.\d+\.\d+\.\d+)/.exec(out);
  if (!m) throw new Error("Could not determine the Windows host IP (ip route).");
  return m[1];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CaptureBrowser = {
  browser: Browser;
  /** Closes the CDP connection AND kills the spawned Windows process. */
  close: () => Promise<void>;
};

export async function launchCaptureBrowser(): Promise<CaptureBrowser> {
  const host = wslGatewayIp();
  const proc = spawn(WIN_CHROME_EXE, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${WIN_USER_DATA_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
    // The app's DB host (db.nolli-map.com) CORS-allowlists localhost:5173 only;
    // when the app runs on another port (5173 taken by another dev server), the
    // DB fetch would be blocked and the app would boot to /error with no map.
    // This browser is a throwaway capture instance, so relaxing CORS is safe.
    "--disable-web-security",
    // sRGB color profile so screenshots aren't color-shifted by Chromium's
    // color management.
    "--force-color-profile=srgb",
    "--window-size=1920,1080",
  ], { stdio: "ignore" });
  const url = `http://${host}:${CDP_PORT}`;
  let browser: Browser | null = null;
  for (let i = 0; i < 30 && !browser; i++) {
    await sleep(1000);
    browser = await chromium.connectOverCDP(url).catch(() => null);
  }
  if (!browser) {
    proc.kill();
    throw new Error(
      `Windows Chrome didn't come up on ${url}. ` +
        `Is the portproxy in place (see README — netsh + firewall, admin PowerShell)?`,
    );
  }
  return {
    browser,
    close: async () => {
      await browser.close().catch(() => {});
      // Killing the WSL interop wrapper terminates the Windows process with it.
      proc.kill();
    },
  };
}

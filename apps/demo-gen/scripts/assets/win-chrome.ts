import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import { LAUNCH_ARGS } from "./capture-helpers";

// Windows-Chrome capture host. The WSL Chromium rasterizes via SwiftShader
// (no hardware Vulkan ICD in WSL), which starves the CDP screencast to ~2fps
// and judders the demo clip. Windows Chrome runs the real GPU, so CAPTURE_WIN_CHROME=1
// launches it over WSL interop and connects via CDP through the host-side
// portproxy (netsh, scoped to the WSL-facing IP — see README). Everything
// downstream (contexts, viewport/DSF emulation, screencast, cursor) is plain
// Playwright/CDP and works unchanged over the connection.
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

const winChromeEnabled = () => process.env.CAPTURE_WIN_CHROME === "1";

export async function launchCaptureBrowser(): Promise<CaptureBrowser> {
  if (!winChromeEnabled()) {
    const browser = await chromium.launch({ args: LAUNCH_ARGS });
    return { browser, close: () => browser.close() };
  }
  const host = wslGatewayIp();
  const proc = spawn(WIN_CHROME_EXE, [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${WIN_USER_DATA_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-web-security",
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

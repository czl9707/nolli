import { spawn, execSync, type ChildProcess } from "node:child_process";
import type { Browser } from "playwright";
import { chromium } from "playwright";

// Windows-Chrome capture host. The WSL Chromium rasterizes via SwiftShader
// (no hardware Vulkan ICD in WSL), which starves the CDP screencast to ~2fps
// and judders the demo clip, so capture always runs on Windows Chrome (real
// GPU), launched over WSL interop. Chrome only binds CDP on 127.0.0.1
// (--remote-debugging-address is no longer honored), which WSL can't reach
// under NAT — the PowerShell relay below binds the WSL-facing gateway IP and
// byte-pumps every connection to loopback. Same shape the old netsh portproxy
// gave, but self-managed (no admin, no iphlpsvc listener that silently
// vanishes after reboots). The scoped firewall rule (WSL subnet → 9333, see
// README) still gates access. Everything downstream (contexts, viewport/DSF
// emulation, screencast, cursor) is plain Playwright/CDP and works unchanged
// over the connection.
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

// A per-connection bidirectional byte pipe gateway-ip:9333 → 127.0.0.1:9333.
// Each direction pumps on a .NET threadpool task; no completion callbacks —
// PS 5.1 can't bind a scriptblock to Action<Task>, and CDP peers (Playwright)
// close their sockets fully, which ends both pumps. A per-connection failure
// (e.g. the browser restarting) drops that connection only; the accept loop
// keeps serving.
const relayScript = (gw: string) => `
  $ErrorActionPreference = 'Stop'
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('${gw}'), ${CDP_PORT})
  $listener.Start()
  while ($true) {
    try {
      $client = $listener.AcceptTcpClient()
      $upstream = [System.Net.Sockets.TcpClient]::new('127.0.0.1', ${CDP_PORT})
      $null = $client.GetStream().CopyToAsync($upstream.GetStream())
      $null = $upstream.GetStream().CopyToAsync($client.GetStream())
    } catch { Start-Sleep -Milliseconds 100 }
  }
`;

const startRelay = (gw: string): ChildProcess =>
  spawn("powershell.exe", ["-NoProfile", "-Command", relayScript(gw)], { stdio: "ignore" });

export type CaptureBrowser = {
  browser: Browser;
  /** Closes the CDP connection AND kills the spawned Windows processes. */
  close: () => Promise<void>;
};

export async function launchCaptureBrowser(): Promise<CaptureBrowser> {
  const host = wslGatewayIp();
  const relay = startRelay(host);
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
    relay.kill();
    throw new Error(
      `Windows Chrome didn't come up on ${url}. ` +
        `Is the firewall rule in place (see README — New-NetFirewallRule, admin PowerShell)?`,
    );
  }
  return {
    browser,
    close: async () => {
      await browser.close().catch(() => {});
      // Killing the WSL interop wrappers terminates the Windows processes with them.
      proc.kill();
      relay.kill();
    },
  };
}

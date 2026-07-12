import { vi } from "vitest"

class WorkerStub {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

globalThis.Worker = WorkerStub as unknown as typeof Worker

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size
  },
} as unknown as Storage

globalThis.fetch = vi.fn(() => Promise.reject(new Error("no network in tests"))) as typeof fetch

// @nolli/board's barrel reaches @nolli/ui's theme store, which reads
// localStorage at module load — node-vitest has no DOM storage.
const store = new Map<string, string>()
const stub: Storage = {
  get length() {
    return store.size
  },
  clear: () => store.clear(),
  getItem: (k) => store.get(k) ?? null,
  key: (i) => [...store.keys()][i] ?? null,
  removeItem: (k) => store.delete(k),
  setItem: (k, v) => store.set(k, String(v)),
}
;(globalThis as { localStorage?: Storage }).localStorage ??= stub
;(globalThis as { sessionStorage?: Storage }).sessionStorage ??= stub
// theme store also resolves the system preference at module load
;(globalThis as { window?: typeof globalThis }).window ??= globalThis
;(globalThis as { matchMedia?: unknown }).matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})

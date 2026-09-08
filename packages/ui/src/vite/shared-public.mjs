import { readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative, resolve, sep } from "node:path"

const MIME = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
}

// Serves a package-owned directory of root-level static files (brand icons)
// during dev and emits them with the build, so apps don't each keep a copy
// in their own public/. Plain .mjs — vite.config externalizes and loads it
// with plain node, which can't run TypeScript.
/** @param {string} dir @returns {import("vite").Plugin} */
export function sharedPublic(dir) {
  const root = resolve(dir)

  const listFiles = () => {
    const out = []
    const visit = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        if (e.isDirectory()) visit(p)
        else if (e.isFile()) out.push(p)
      }
    }
    visit(root)
    return out
  }

  return {
    name: "nolli:shared-public",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" || !req.url?.startsWith("/")) return next()
        let path
        try {
          path = decodeURIComponent(req.url.split("?")[0])
        } catch {
          return next()
        }
        const file = join(root, path.slice(1))
        if (!(file + sep).startsWith(root + sep)) return next()
        if (!statSync(file, { throwIfNoEntry: false })?.isFile()) return next()
        res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream")
        res.end(readFileSync(file))
      })
    },
    generateBundle() {
      for (const f of listFiles()) {
        this.emitFile({
          type: "asset",
          fileName: relative(root, f).split(sep).join("/"),
          source: readFileSync(f),
        })
      }
    },
  }
}

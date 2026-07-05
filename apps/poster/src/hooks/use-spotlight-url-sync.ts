// apps/poster/src/hooks/use-spotlight-url-sync.ts
import { useEffect } from "react"
import { useSpotlightStore } from "@/stores/spotlight"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * Keeps the spotlight settings two-way in sync with the URL query string.
 * - store → URL: any setting change is serialized via `setParams`.
 * - URL → store: on `popstate` (back/forward), re-parse and bulk-replace.
 *
 * Caption-text overrides (customName / customArchitect) are deliberately NOT
 * synced — they're ephemeral, in-memory only. Parallels use-route-sync /
 * use-map-url-state. Mounted once by <PosterShell>.
 */
export function useSpotlightUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const p = parseMapParams(window.location.search)
      const s = useSpotlightStore.getState()
      // Only the URL-backed fields change on popstate; customName/customArchitect
      // are ephemeral, so carry the current values through.
      s.replace({
        imageEdge: p.imageEdge,
        imageCorner: p.imageCorner,
        nameSize: p.nameSize,
        architectSize: p.architectSize,
        customName: s.customName,
        customArchitect: s.customArchitect,
      })
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Write each URL-backed setting to the URL when it changes.
  const imageEdge = useSpotlightStore((s) => s.imageEdge)
  const imageCorner = useSpotlightStore((s) => s.imageCorner)
  const nameSize = useSpotlightStore((s) => s.nameSize)
  const architectSize = useSpotlightStore((s) => s.architectSize)

  useEffect(() => {
    setParams({
      imageEdge,
      imageCorner,
      nameSize,
      architectSize,
    })
  }, [imageEdge, imageCorner, nameSize, architectSize])
}

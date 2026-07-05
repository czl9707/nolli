// apps/poster/src/hooks/use-spotlight-url-sync.ts
import { useEffect } from "react"
import { useSpotlightStore } from "@/stores/spotlight"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * Keeps the spotlight settings two-way in sync with the URL query string.
 * - store → URL: any setting change is serialized via `setParams`.
 * - URL → store: on `popstate` (back/forward), re-parse and bulk-replace.
 *
 * Caption-text overrides (customPrimary / customSecondary) are deliberately NOT
 * synced — they're ephemeral, in-memory only. Parallels use-route-sync /
 * use-map-url-state. Mounted once by <PosterShell>.
 */
export function useSpotlightUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const p = parseMapParams(window.location.search)
      const s = useSpotlightStore.getState()
      // Only the URL-backed fields change on popstate; customPrimary/customSecondary
      // are ephemeral, so carry the current values through.
      s.replace({
        captionEdge: p.captionEdge,
        captionCorner: p.captionCorner,
        primarySize: p.primarySize,
        secondarySize: p.secondarySize,
        customPrimary: s.customPrimary,
        customSecondary: s.customSecondary,
      })
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Write each URL-backed setting to the URL when it changes.
  const captionEdge = useSpotlightStore((s) => s.captionEdge)
  const captionCorner = useSpotlightStore((s) => s.captionCorner)
  const primarySize = useSpotlightStore((s) => s.primarySize)
  const secondarySize = useSpotlightStore((s) => s.secondarySize)

  useEffect(() => {
    setParams({
      captionEdge,
      captionCorner,
      primarySize,
      secondarySize,
    })
  }, [captionEdge, captionCorner, primarySize, secondarySize])
}

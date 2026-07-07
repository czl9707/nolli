// apps/poster/src/hooks/use-caption-url-sync.ts
import { useEffect } from "react"
import { useCaptionStore } from "@/stores/caption"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * Keeps the caption settings two-way in sync with the URL query string.
 * - store → URL: any setting change is serialized via `setParams`.
 * - URL → store: on `popstate` (back/forward), re-parse and bulk-replace.
 */
export function useCaptionUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const p = parseMapParams(window.location.search)
      const s = useCaptionStore.getState()
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
  const captionEdge = useCaptionStore((s) => s.captionEdge)
  const captionCorner = useCaptionStore((s) => s.captionCorner)
  const primarySize = useCaptionStore((s) => s.primarySize)
  const secondarySize = useCaptionStore((s) => s.secondarySize)

  useEffect(() => {
    setParams({
      captionEdge,
      captionCorner,
      primarySize,
      secondarySize,
    })
  }, [captionEdge, captionCorner, primarySize, secondarySize])
}

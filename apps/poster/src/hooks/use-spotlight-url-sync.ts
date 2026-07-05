// apps/poster/src/hooks/use-spotlight-url-sync.ts
import { useEffect } from "react"
import { useSpotlightStore } from "@/stores/spotlight"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * Keeps the spotlight settings two-way in sync with the URL query string.
 * - store → URL: any setting change is serialized via `setParams`.
 * - URL → store: on `popstate` (back/forward), re-parse and bulk-replace.
 *
 * Parallels use-route-sync / use-map-url-state. Mounted once by <PosterShell>.
 */
export function useSpotlightUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const p = parseMapParams(window.location.search)
      useSpotlightStore.getState().replace({
        imageEdge: p.imageEdge,
        captionCorner: p.captionCorner,
        captionDirection: p.captionDirection,
        nameSize: p.nameSize,
        architectSize: p.architectSize,
        customName: p.customName,
        customArchitect: p.customArchitect,
      })
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Write each setting to the URL when it changes.
  const imageEdge = useSpotlightStore((s) => s.imageEdge)
  const captionCorner = useSpotlightStore((s) => s.captionCorner)
  const captionDirection = useSpotlightStore((s) => s.captionDirection)
  const nameSize = useSpotlightStore((s) => s.nameSize)
  const architectSize = useSpotlightStore((s) => s.architectSize)
  const customName = useSpotlightStore((s) => s.customName)
  const customArchitect = useSpotlightStore((s) => s.customArchitect)

  useEffect(() => {
    setParams({
      imageEdge,
      captionCorner,
      captionDirection,
      nameSize,
      architectSize,
      customName,
      customArchitect,
    })
  }, [imageEdge, captionCorner, captionDirection, nameSize, architectSize, customName, customArchitect])
}

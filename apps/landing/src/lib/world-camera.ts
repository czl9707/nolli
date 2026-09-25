import type { SceneCamera } from "@nolli/map"
import { isMobile } from "@nolli/ui"

/** World hold camera. The ledger bounds span −133°..157° of longitude —
 *  zoom 1.05 fits that span into the desktop band; the mobile band is
 *  ~4× narrower, so the zoom drops to keep every pinned work on the map.
 *  Lives apart from constants.ts so the bake script can import the decks
 *  without pulling @nolli/ui's css through tsx. */
export function worldCamera(): SceneCamera {
  const center = [12, 25] as [number, number]
  return isMobile() ? { center, zoom: -1.15 } : { center, zoom: 1.05 }
}

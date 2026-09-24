// The dark veil over the spine's map layer. Photo markers are maplibre
// markers in the canvas container, so the veil is inserted there
// imperatively, right after the canvas — above the tiles, under every
// marker (a scene-DOM or portal veil would paint over the cards). Owns
// its own gating: fades in/out with map ownership.
import { useEffect, useRef } from "react"
import { useSceneOwnsMap, useSpineMap } from "@/spine/spine"
import { useLinger } from "@/lib/use-linger"
import styles from "./map-veil.module.css"

export function MapVeil() {
  const on = useSceneOwnsMap()
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const veilRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!mounted || !map) return
    const canvas = map.getCanvas()
    const veil = document.createElement("div")
    veil.className = styles.veil
    veil.setAttribute("aria-hidden", "true")
    canvas.parentElement!.insertBefore(veil, canvas.nextSibling)
    veilRef.current = veil
    return () => {
      veil.remove()
      veilRef.current = null
    }
  }, [mounted, map])
  useEffect(() => {
    if (veilRef.current) veilRef.current.style.opacity = visible ? "1" : "0"
  }, [visible])
  return null
}

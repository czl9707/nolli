import { useEffect, useState } from "react"
import { BoardItem } from "@nolli/board"
import { CLOSEUP_SLOT } from "@/lib/slots"

const MARGIN = 15

/** Paper card rendered UNDER the stage map layer: the closeup map window
 * reads as a paper item — cream margin, torn edge, pin, drop shadow — while
 * the live map layer above shows through the hole. BoardItem takes px
 * geometry, so the slot fractions are resolved against the viewport here. */
export function CloseupMapCard() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  const width = CLOSEUP_SLOT.w * vp.w + MARGIN * 2
  const height = CLOSEUP_SLOT.h * vp.h + MARGIN * 2
  return (
    <BoardItem
      id="closeup-map"
      position={{
        x: CLOSEUP_SLOT.cx * vp.w - width / 2,
        y: CLOSEUP_SLOT.cy * vp.h - height / 2,
        width,
        height,
        rotation: 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }} />
    </BoardItem>
  )
}

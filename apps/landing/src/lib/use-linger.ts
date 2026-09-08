import { useEffect, useState } from "react"

/** Mount gate for elements that animate their own exit (css transition on
 * a class): returns [mounted, visible]. Rising edge mounts immediately and
 * flips visible a beat later so the enter transition fires on an element
 * that exists without the class; falling edge drops visible at once and
 * unmounts after ms, giving the exit transition time to finish. Quick
 * off→on flips inside the window cancel the unmount. */
export function useLinger(on: boolean, ms: number): [boolean, boolean] {
  const [mounted, setMounted] = useState(on)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (on) {
      setMounted(true)
      const t = setTimeout(() => setVisible(true), 20)
      return () => clearTimeout(t)
    }
    setVisible(false)
    const t = setTimeout(() => setMounted(false), ms)
    return () => clearTimeout(t)
  }, [on, ms])
  return [mounted, visible]
}

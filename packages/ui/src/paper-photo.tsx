import { useMemo, type ComponentProps } from "react"
import { Note } from "./typography"
import { hashId, jitter, paperClipPath, paperSurface } from "./paper"
import styles from "./paper-photo.module.css"

// The shared photo card: paper surface + torn clip + seeded tilt + mat +
// caption row. Consumers own motion and positioning.
export function PaperPhoto({
  src,
  alt,
  width,
  height,
  caption,
  captionSub,
  seed,
  tilt = 2,
  pin,
  crossOrigin = "anonymous",
  className,
  ...rest
}: {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
  captionSub?: string
  /** Drives the deterministic tilt + torn clip — stable across renders. */
  seed: string
  /** Max tilt in degrees, symmetric around 0. */
  tilt?: number
  /** Map pin standing on the card's top edge. */
  pin?: boolean
  /** Extra class on the card root. */
  className?: string
  /** Pass null on pages without COOP/COEP — the attribute forces a CORS
   * fetch, which image hosts may not allow for that page's origin. */
  crossOrigin?: "anonymous" | null
} & Omit<ComponentProps<"div">, "className">) {
  const rotate = useMemo(
    () => jitter(hashId(seed) + 50, tilt) - tilt / 2,
    [seed, tilt],
  )
  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.shadow}>
        <div
          className={`${paperSurface} ${styles.card}`}
          style={{ transform: `rotate(${rotate}deg)`, clipPath: paperClipPath(seed) }}
        >
          <img
            className={styles.photo}
            src={src}
            alt={alt}
            width={width}
            height={height}
            crossOrigin={crossOrigin ?? undefined}
          />
          {(caption || captionSub) && (
            <figcaption className={styles.caption} style={{ width }}>
              {caption && <Note className={styles.captionMain}>{caption}</Note>}
              {captionSub && <Note className={styles.captionSub}>{captionSub}</Note>}
            </figcaption>
          )}
        </div>
      </div>
      {pin && <img className={styles.pin} src="/images/pin.png" alt="" />}
    </div>
  )
}

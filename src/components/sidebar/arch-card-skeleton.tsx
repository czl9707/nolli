import { useEffect, useRef } from "react"
import styles from "./arch-card-skeleton.module.css"

export function ArchCardSkeleton({
  onLoadMore,
}: {
  onLoadMore: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore])

  return (
    <div ref={ref} className={styles.skeleton}>
      <div className={styles.imagePulse} />
      <div className={styles.textPulse}>
        <div className={styles.line1} />
        <div className={styles.line2} />
      </div>
    </div>
  )
}

import type { ComponentProps, ReactNode } from "react"
import { Body1, Body2, Caption } from "@nolli/ui"
import { SidebarCard } from "./sidebar-card"
import styles from "./media-card.module.css"

/** Presentational image-led row: a cover thumbnail + a text block, on a
 *  SidebarCard. Interactive behavior (hover, selected, click) and overlays
 *  (e.g. FavoriteToggle) come from the caller via `...props` and `children`. */
export function MediaCard({
  coverUrl,
  coverAlt,
  title,
  subtitle,
  foot,
  children,
  className,
  ...props
}: {
  coverUrl: string | null
  coverAlt: string
  title: string
  subtitle?: string
  foot?: ReactNode
  children?: ReactNode
} & Omit<ComponentProps<"div">, "className"> & { className?: string }) {
  return (
    <SidebarCard className={`${styles.mediaCard} ${className ?? ""}`} {...props}>
      {children}
      {coverUrl ? (
        <img
          className={`${styles.thumbnail} ${styles.image}`}
          src={coverUrl}
          alt={coverAlt}
          loading="lazy"
        />
      ) : (
        <div className={`${styles.thumbnail} ${styles.placeholder}`} aria-hidden />
      )}
      <div className={styles.textBlock}>
        <Body1 className={styles.name}>{title}</Body1>
        {subtitle && <Body2 className={styles.subtitle}>{subtitle}</Body2>}
        {foot && <Caption className={styles.foot}>{foot}</Caption>}
      </div>
    </SidebarCard>
  )
}

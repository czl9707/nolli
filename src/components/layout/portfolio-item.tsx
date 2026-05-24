import type { ArchPage } from "@/lib/data/architectures"
import { PortfolioShell } from "@/components/layout/portfolio-shell"
import { Body1, Body2 } from "@/components/ui/typography"
import styles from "./portfolio-item.module.css"

type PortfolioItemProps = {
  page: ArchPage
  index: number
  total: number
}

export function PortfolioItem({ page, index, total }: PortfolioItemProps) {
  return (
    <PortfolioShell index={index} total={total}>
      <div className={styles.imageSlot}>
        <img src={page.image} alt="" className={styles.image} />
      </div>
      {page.caption && (
        <div className={styles.captionSlot}>
          <Body1 className={styles.captionTitle}>{page.caption.title ?? ""} <br /></Body1>
          <Body2 className={styles.captionText}>{page.caption.text ?? " "} <br /></Body2>
        </div>
      )}
    </PortfolioShell>
  )
}

import { motion } from "framer-motion"
import type { ArchPage } from "@/data/architectures"
import styles from "./portfolio-item.module.css"
import { Body1, Body2 } from "@/components/ui/typography"

type PortfolioItemProps = {
  page: ArchPage
  index: number
  total: number
  delay?: number
}

export function PortfolioItem({ page, index, total, delay = 0 }: PortfolioItemProps) {
  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <div className={styles.content}>
          <div className={styles.imageSlot}>
            {page.image && (
              <img src={page.image} alt="" className={styles.image} />
            )}
          </div>
          <div className={styles.textSlot}>
            {page.text && (
              <Body2 className={styles.text}>{page.text}</Body2>
            )}
          </div>
      </div>
      <Body2 className={styles.pageIndex}>
        {index + 1} / {total}
      </Body2>
    </motion.div>
  )
}

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import styles from "./portfolio-shell.module.css"
import { Body2 } from "@/components/ui/typography"

type PortfolioShellProps = {
  children: ReactNode
  index: number
  total: number
  className?: string
}

export function PortfolioShell({ children, index, total, className }: PortfolioShellProps) {
  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.6, delay: 0.6 + index * 0.1 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      <div className={`${styles.content} ${className}`}>{children}</div>
      <Body2 className={styles.pageIndex}>
        {index + 1} / {total}
      </Body2>
    </motion.div>
  )
}

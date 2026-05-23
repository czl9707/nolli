import { motion } from "framer-motion"
import styles from "./portfolio-item.module.css"

export function PortfolioItem({children, delay = 0}: {children: React.ReactNode, delay?: number}) {
  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay } }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {children}
    </motion.div>
   )
}

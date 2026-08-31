import { motion, useReducedMotion } from "framer-motion"
import { H1 } from "@nolli/ui"
import styles from "./hero.chrome.module.css"

const HEADLINE_LINES = [
  <>
    <span className={styles.headlineAccent}>Nolli</span> is a map
  </>,
  <>for architectures.</>,
]

/** The hero headline, shared by the spine hero and the boot cover so the
 * cover's fade-out reads as the hero arriving rather than a loader
 * finishing. */
export function HeroHeadline() {
  const reduced = useReducedMotion()
  return (
    <H1 className={styles.headline}>
      {HEADLINE_LINES.map((line, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: "easeOut" }}
        >
          {line}
        </motion.div>
      ))}
    </H1>
  )
}

import { useSidebar } from "@/contexts/sidebar"
import { useSelectedArch } from "@/contexts/selected-arch"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_SHORT } from "@/lib/animation"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import styles from "./sidebar.module.css"

export function Sidebar() {
  const { sidebarOpen } = useSidebar()
  const { lastSelectedArch, setLastSelectedArch } = useSelectedArch()
  const navigate = useNavigate()

  const sidebarView = lastSelectedArch ? "arch" : "panel"

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          key="sidebar"
          className={styles.sidebarWrapper}
          initial={{ width: 0, paddingRight: 0 }}
          animate={{ width: 360, paddingRight: "var(--spacing-paragraph)" }}
          exit={{ width: 0, paddingRight: 0 }}
          transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className={styles.sidebarContent}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: TRANSITION_SHORT,
                delay: TRANSITION_SHORT,
              },
            }}
            exit={{ opacity: 0, transition: { duration: TRANSITION_SHORT } }}
          >
            <AnimatePresence mode="wait">
              {sidebarView === "arch" && lastSelectedArch ? (
                <ArchSummary
                  key="arch"
                  arch={lastSelectedArch}
                  onView={() => navigate(`/arch/${lastSelectedArch.slug}`)}
                  onClose={() => setLastSelectedArch(null)}
                />
              ) : (
                <OperationPanel key="panel" />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

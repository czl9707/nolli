import { H5, Body1 } from "@/components/ui/typography"
import { SidebarCard } from "./sidebar-card"
import styles from "./operation-panel.module.css"

export function OperationPanel() {
  return (
    <>
      <SidebarCard>
        <H5 className={styles.heading}>Filters</H5>
        <Body1 className={styles.body}>Coming soon</Body1>
      </SidebarCard>
      <SidebarCard>
        <H5 className={styles.heading}>Collections</H5>
        <Body1 className={styles.body}>Coming soon</Body1>
      </SidebarCard>
    </>
  )
}

import styles from "./sidebar-card.module.css"

export function SidebarCard({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`${styles.card} ${className ?? ""}`} {...props}>
      {children}
    </div>
  )
}

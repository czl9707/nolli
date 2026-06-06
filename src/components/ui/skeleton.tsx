import styles from "./skeleton.module.css"

type SkeletonProps = React.ComponentProps<"div"> & {
  width?: string | number
  height?: string | number
}

function Skeleton({
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  )
}

export { Skeleton }

// Pane-split primitives, ported from apps/landing/src/scenes/grid.tsx.
// HSplit = flex column (children stack top-to-bottom), VSplit = flex row —
// landing's naming, kept so the scene trees read the same. Each Pane declares
// its own size (any CSS length; omit to fill). The border between sibling
// panes IS the split line.
import { type ReactNode } from "react";
import styles from "./grid.module.css";

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={[styles.screen, className].filter(Boolean).join(" ")}>{children}</section>;
}

export const HSplit: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={[styles.splitCell, styles.colSplit, className].filter(Boolean).join(" ")}>{children}</div>
);

export const VSplit: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={[styles.splitCell, styles.rowSplit, className].filter(Boolean).join(" ")}>{children}</div>
);

export function Pane({
  size,
  className,
  filled,
  children,
}: {
  size?: string;
  className?: string;
  /** Tile the pane with the building pattern (map fill texture). */
  filled?: boolean;
  children?: ReactNode;
}) {
  const fill = size === undefined;
  return (
    <div
      className={[styles.pane, fill ? styles.paneFill : "", className].filter(Boolean).join(" ")}
      style={{ flexBasis: size }}
    >
      {filled && <div className={styles.paneFilled} />}
      {children}
    </div>
  );
}

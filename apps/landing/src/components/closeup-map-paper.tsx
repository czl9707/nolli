import styles from "./closeup-map-paper.module.css"

/** The map item's paper frame, rendered UNDER the stage map layer — the app
 * pin-board's map slot treatment: 10px solid paper border + soft shadow, no
 * radius. The live map layer above fills the inner box exactly. Follows the
 * per-arch board shift via the stage's --board-shift-* vars. */
export function CloseupMapPaper() {
  return <div className={styles.paper} />
}

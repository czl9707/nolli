import { useUiStore } from "@/stores/ui"
import styles from "./capture-toggle.module.css"

export function CaptureToggle() {
  const captureMode = useUiStore((s) => s.captureMode)
  const toggleCapture = useUiStore((s) => s.toggleCapture)
  return (
    <button className={styles.button} onClick={toggleCapture}>
      {captureMode ? "Exit capture" : "Capture"}
    </button>
  )
}

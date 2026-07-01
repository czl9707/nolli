import { useUiStore } from "@/stores/ui"
import { Button } from "@nolli/ui"

/** Lives in the header. Toggling capture hides markers/controls and the sidebar. */
export function CaptureToggle() {
  const captureMode = useUiStore((s) => s.captureMode)
  const toggleCapture = useUiStore((s) => s.toggleCapture)
  return (
    <Button variant="ghost" onClick={toggleCapture}>
      {captureMode ? "Exit capture" : "Capture"}
    </Button>
  )
}

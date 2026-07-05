import { Eye, EyeOff } from "lucide-react"
import { useUiStore } from "@/stores/ui"
import { Button } from "@nolli/ui"

/** Lives in the header. Enters preview mode: a clean, screenshot-ready frame —
 *  sidebar and map controls hidden (and, in overview, the markers too). */
export function PreviewToggle() {
  const previewMode = useUiStore((s) => s.previewMode)
  const togglePreview = useUiStore((s) => s.togglePreview)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePreview}
      aria-label={previewMode ? "Exit preview" : "Preview"}
      aria-pressed={previewMode}
    >
      {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
    </Button>
  )
}

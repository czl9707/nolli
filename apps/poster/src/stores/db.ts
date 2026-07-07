import { useDbStore } from "@nolli/data"
import { toast } from "sonner"

let toasted = false
useDbStore.subscribe((s) => {
  if (toasted) return
  if (s.error) {
    toasted = true
    toast.error(s.error.message || "Failed to load map data", {
      duration: 20000,
      position: "top-center",
    })
  } else if (!s.loading && s.message) {
    toasted = true
    toast.info(s.message)
  }
})

export { useDbStore }
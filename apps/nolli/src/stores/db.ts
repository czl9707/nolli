import { useDbStore } from "@nolli/data"
import { toast } from "sonner"

// The db bootstrap store (SqliteDataSource spawn + OPFS download) lives in
// @nolli/data so both nolli and poster share it. This module re-exports it
// unchanged and adds nolli's app-side UX: surface the ready/error info as a
// toast once per session.
export { useDbStore }

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

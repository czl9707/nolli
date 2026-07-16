import { useEffect, useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"
import { X } from "lucide-react"
import { Body2, Button, ScrollArea } from "@nolli/ui"
import { hashId, jitter } from "@nolli/board"
import type { FormValues } from "./shape-payload"
import styles from "./note-editor.module.css"

export function NoteEditor({ form }: { form: UseFormReturn<FormValues> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "notes" })

  // Remap vertical wheel → horizontal scroll on the strip's viewport, so a
  // normal mouse wheel pans the row sideways. Skipped when the cursor is over a
  // note's textarea, so a long note still scrolls vertically in place.
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const strip = stripRef.current
    const viewport = strip?.closest(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null
    if (!viewport) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (e.target instanceof HTMLElement && e.target.closest("textarea")) return
      viewport.scrollLeft += e.deltaY
      e.preventDefault()
    }
    viewport.addEventListener("wheel", onWheel, { passive: false })
    return () => viewport.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <ScrollArea scrollbars="horizontal" className={styles.notesScroll}>
      <div className={styles.notesStrip} ref={stripRef}>
        <button
          type="button"
          className={styles.addNote}
          onClick={() => append({ text: "" })}
        >
          <Body2>Add note</Body2>
        </button>
        {fields.map((f, i) => (
          <div
            key={f.id}
            className={styles.noteCard}
            style={{ transform: `rotate(${jitter(hashId(f.id), 4) - 2}deg)` }}
          >
            <textarea
              className={styles.noteText}
              placeholder="Type to add a note..."
              {...form.register(`notes.${i}.text`)}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              className={styles.noteRemove}
              onClick={() => remove(i)}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

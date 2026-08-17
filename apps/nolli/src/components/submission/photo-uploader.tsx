import { useEffect, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Body2, Body3, Button, Caption, ScrollArea } from "@nolli/ui"
import { hashId, jitter } from "@nolli/board"
import type { FormValues } from "./shape-payload"
import styles from "./photo-uploader.module.css"

const STAGING_BASE = import.meta.env.VITE_R2_PUBLIC_STAGING_URL ?? ""

type DecodedPhoto = { file: File; width: number; height: number }

export function PhotoUploader({ form }: { form: UseFormReturn<FormValues> }) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "photos" })
  // Native drag-to-reorder. dragIndex tracks the thumb currently being dragged;
  // as the cursor crosses a sibling's midpoint we move() live so items shuffle.
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const objectUrls = useRef<Map<string, string>>(new Map())
  for (const f of fields) {
    if (f.kind === "new" && !objectUrls.current.has(f.id)) {
      objectUrls.current.set(f.id, URL.createObjectURL(f.file))
    }
  }
  useEffect(() => {
    const live = new Set(
      fields.filter((f) => f.kind === "new").map((f) => f.id),
    )
    for (const [id, url] of objectUrls.current) {
      if (!live.has(id)) {
        URL.revokeObjectURL(url)
        objectUrls.current.delete(id)
      }
    }
  }, [fields])

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrls.current.clear()
    }
  }, [])

  return (
    <ScrollArea scrollbars="horizontal" className={styles.scrollRoot}>
      <div className={styles.strip}>
        <PhotoDropZone
          onAdd={(entries) =>
            entries.forEach((e) =>
              append({ kind: "new", file: e.file, width: e.width, height: e.height, caption: "" }),
            )
          }
        />

        {fields.map((f, i) => (
          <PhotoThumb
            key={f.id}
            id={f.id}
            index={i}
            cover={i === 0}
            dragging={dragIndex === i}
            dragIndex={dragIndex}
            src={
              f.kind === "new"
                ? (objectUrls.current.get(f.id) ?? "")
                : `${STAGING_BASE}/${f.staging_key}`
            }
            onDragStart={setDragIndex}
            onReorderTo={(target) => {
              if (dragIndex !== null && dragIndex !== target) {
                move(dragIndex, target)
                setDragIndex(target)
              }
            }}
            onDragEnd={() => setDragIndex(null)}
            onRemove={() => remove(i)}
          />
        ))}

        {fields.length === 0 && (
          <Caption className={styles.hint}>At least one photo is required.</Caption>
        )}
      </div>
    </ScrollArea>
  )
}


function PhotoDropZone({ onAdd }: { onAdd: (entries: DecodedPhoto[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setReading(true)
    const decoded: DecodedPhoto[] = []
    let failed = 0
    try {
      for (const file of Array.from(files)) {
        try {
          const bitmap = await createImageBitmap(file)
          decoded.push({ file, width: bitmap.width, height: bitmap.height })
          bitmap.close()
        } catch {
          failed += 1
        }
      }
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
    if (decoded.length > 0) onAdd(decoded)
    if (failed > 0) {
      toast.error(
        failed === Array.from(files).length
          ? "Could not read those images."
          : `Added ${files.length - failed} of ${files.length}; ${failed} unreadable.`,
      )
    }
  }

  return (
    <button
      type="button"
      className={styles.dropzone}
      data-dragging={dragging}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        // Only react to OS file drags — internal thumb reordering is handled
        // on the thumbs themselves.
        if (!e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        addFiles(e.dataTransfer.files)
      }}
    >
      {reading ? <Loader2 size={20} className={styles.spin} /> : <Body2>Add photo</Body2>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />
    </button>
  )
}

/**
 * One photo in the strip: paper-framed thumbnail with a stable per-id rotation,
 * a "cover" badge when it's first, and a remove button. Also the drag source and
 * drop target for native reordering — onReorderTo(index) fires once the cursor
 * crosses this thumb's midpoint, so the parent can move() the dragged item here.
 */
function PhotoThumb({
  id,
  src,
  index,
  cover,
  dragging,
  dragIndex,
  onDragStart,
  onReorderTo,
  onDragEnd,
  onRemove,
}: {
  id: string
  src: string
  index: number
  cover: boolean
  dragging: boolean
  dragIndex: number | null
  onDragStart: (index: number) => void
  onReorderTo: (index: number) => void
  onDragEnd: () => void
  onRemove: () => void
}) {
  return (
    <div
      className={styles.thumb}
      data-dragging={dragging}
      style={{ transform: `rotate(${jitter(hashId(id), 4) - 2}deg)` }}
      draggable
      onDragStart={(e) => {
        // Hint that we're moving an element, not copying a file.
        e.dataTransfer.effectAllowed = "move"
        // Live reorder moves this node around the DOM mid-drag, which blanks
        // the native drag preview. Snapshot a detached clone so a figure
        // stays under the cursor; drop it once the browser has captured it.
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement
        ghost.style.position = "absolute"
        ghost.style.top = "-9999px"
        ghost.style.left = "-9999px"
        document.body.appendChild(ghost)
        const { width, height } = e.currentTarget.getBoundingClientRect()
        e.dataTransfer.setDragImage(ghost, width / 2, height / 2)
        requestAnimationFrame(() => ghost.remove())
        onDragStart(index)
      }}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.dataTransfer.dropEffect = "move"
        e.preventDefault()
        if (dragIndex === null || dragIndex === index) return
        const rect = e.currentTarget.getBoundingClientRect()
        const mid = rect.left + rect.width / 2
        if (dragIndex < index && e.clientX <= mid) return
        if (dragIndex > index && e.clientX >= mid) return
        onReorderTo(index)
      }}
      onDragEnd={onDragEnd}
    >
      <img src={src} alt="" className={styles.img} loading="lazy" />
      {cover && <Body3 className={styles.cover}>cover</Body3>}
      <Button variant="secondary" size="icon-xs" className={styles.remove} onClick={onRemove}>
        <X size={14} />
      </Button>
    </div>
  )
}

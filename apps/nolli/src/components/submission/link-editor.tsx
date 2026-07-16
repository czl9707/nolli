import { useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"
import { Button, Input } from "@nolli/ui"
import { classifyLinkType, defaultLinkLabel, type LinkType, type FormValues } from "./shape-payload"
import styles from "./link-editor.module.css"
import { Plus, Trash } from "lucide-react"

export function LinkEditor({ form }: { form: UseFormReturn<FormValues> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "links" })
  const links = form.watch("links")
  const prevTypeRef = useRef<Record<string, LinkType>>({})

  // Recognized sources (Wikipedia, ArchDaily) own their label: force it to the
  // canonical text and lock the field. When a URL transitions away from a
  // recognized source the machine-set label is cleared. prevTypeRef scopes the
  // clear to a real special→custom change, so a label the user typed themselves
  // is never wiped.
  function syncLabel(i: number, fId: string, url: string) {
    const type = classifyLinkType(url)
    const prev = prevTypeRef.current[fId]
    const canonical = defaultLinkLabel(type)
    const current = form.getValues(`links.${i}.label`)
    if (canonical !== null) {
      if (current !== canonical) {
        form.setValue(`links.${i}.label`, canonical, { shouldDirty: true })
      }
    } else if (
      prev !== undefined &&
      prev !== "custom" &&
      (current === "Wikipedia" || current === "ArchDaily")
    ) {
      form.setValue(`links.${i}.label`, "", { shouldDirty: true })
    }
    prevTypeRef.current[fId] = type
  }

  return (
    <div className={styles.stack}>
      {fields.map((f, i) => {
        const locked = classifyLinkType(links[i]?.url ?? "") !== "custom"
        return (
          <div key={f.id} className={styles.linksRow}>
            <Input
              placeholder="Label"
              readOnly={locked}
              className={locked ? styles.labelLocked : undefined}
              value={links[i]?.label ?? ""}
              onChange={(e) =>
                form.setValue(`links.${i}.label`, e.target.value, { shouldDirty: true })
              }
            />
            <Input
              placeholder="https://"
              {...form.register(`links.${i}.url`, {
                onChange: (e) => syncLabel(i, f.id, e.target.value),
              })}
            />
            <Button variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash size={16} />
            </Button>
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={() => append({ label: "", url: "" })}
      >
        <Plus size={16} /> Add link
      </Button>
    </div>
  )
}

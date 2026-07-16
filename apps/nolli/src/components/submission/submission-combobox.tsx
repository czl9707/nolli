import * as React from "react"
import { Command as Cmd } from "cmdk"
import { ChevronDown, CheckIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@nolli/ui"
import styles from "./submission-combobox.module.css"
import inputStyles from "@nolli/ui/input.module.css"

export type ComboboxItem = { value: string; label: string }

type Props = {
  label: string
  placeholder?: string
  items: ComboboxItem[]
  mode: "strict" | "suggest"
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
}

export function SubmissionCombobox({
  label,
  placeholder,
  items,
  mode,
  value,
  onChange,
  onBlur,
  disabled,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedLabel = items.find((i) => i.value === value)?.label ?? value

  // strict: trigger shows the committed value when closed, the local query when open.
  // suggest: the input IS the form value (free text supported), so show `value` always.
  const inputText = mode === "suggest" ? value : open ? query : selectedLabel

  const filterText = mode === "suggest" ? value : query
  const filtered = React.useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (q === "") return items
    return items.filter((i) => i.label.toLowerCase().includes(q))
  }, [items, filterText])

  function handleSelect(item: ComboboxItem) {
    onChange(item.value)
    setQuery("")
    setOpen(false)
  }

  function handleInput(text: string) {
    if (mode === "suggest") {
      onChange(text)
    } else {
      setQuery(text)
    }
  }

  function handleOpenChange(next: boolean) {
    if (disabled) {
      setOpen(false)
      return
    }
    setOpen(next)
    if (next) {
      setQuery(value)
    } else {
      setQuery("")
      onBlur?.()
    }
  }

  const emptyText =
    mode === "strict"
      ? "No match — pick from the list."
      : "No match. Your text is kept as typed."

  return (
    <Cmd label={label} shouldFilter={false}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            tabIndex={disabled ? -1 : 0}
            data-state={open ? "open" : "closed"}
            data-disabled={disabled || undefined}
            className={`${styles.trigger} ${inputStyles.input}`}
          >
            <Cmd.Input
              ref={inputRef}
              value={inputText}
              onValueChange={handleInput}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={styles.input}
            />
            <ChevronDown size={16} className={styles.icon} />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className={styles.popover}
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <Cmd.Empty className={styles.empty}>{emptyText}</Cmd.Empty>
          <Cmd.List className={styles.list}>
            <Cmd.Group className={styles.group}>
              {filtered.map((item) => (
                <Cmd.Item
                  key={item.value}
                  value={item.value}
                  data-checked={value === item.value || undefined}
                  onSelect={() => handleSelect(item)}
                  className={styles.item}
                >
                  {item.label}
                  <CheckIcon className={styles.checkIcon} />
                </Cmd.Item>
              ))}
            </Cmd.Group>
          </Cmd.List>
        </PopoverContent>
      </Popover>
    </Cmd>
  )
}

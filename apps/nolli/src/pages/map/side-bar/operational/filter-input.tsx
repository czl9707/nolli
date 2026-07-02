import * as React from "react"
import { Command as Cmd } from "cmdk"
import { ChevronDown, CheckIcon, X } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@nolli/ui"
import { Badge } from "@nolli/ui"
import { Button } from "@nolli/ui"
import { Caption } from "@nolli/ui"
import styles from "./filter-input.module.css"

type FilterItem = {
    key: string
    label: string
    value: string
    group?: string
}

type FilterInputProps = {
    label: string
    placeholder: string
    items: FilterItem[]
    selected: FilterItem[]
    onToggle: (item: FilterItem) => void
    onClear: () => void
}

function FilterInput({
    label,
    placeholder,
    items,
    selected,
    onClear,
    onToggle,
}: FilterInputProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const grouped = React.useMemo(() => {
        const groups = new Map<string, FilterItem[]>()
        for (const item of items) {
            const g = item.group ?? ""
            if (!groups.has(g)) groups.set(g, [])
            groups.get(g)!.push(item)
        }
        return groups
    }, [items])

    const hasGroups = items.some((i) => i.group !== undefined)

    function handleSelect(item: FilterItem) {
        onToggle(item)
        setSearch("")
    }

    return (
        <div>
            <Caption asChild>
                <label className={styles.label}>{label}</label>
            </Caption>
            <Cmd label={label}>                
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                        asChild
                        onClick={() => {
                            if (!open) setOpen(true)
                        }}
                    >
                        <div
                            role="combobox"
                            aria-expanded={open}
                            aria-label={label}
                            tabIndex={0}
                            data-state={open ? "open" : "closed"}
                            className={styles.trigger}
                        >
                            <div className={styles.badgeContainer}>
                                {selected.map((s) => (
                                    <Badge
                                        key={s.key}
                                        variant="outline"
                                        className={styles.badge}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggle(s)
                                        }}
                                    >
                                        {s.label}
                                        <X size={14} />
                                    </Badge>
                                ))}
                                <Cmd.Input
                                    ref={inputRef}
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder={selected.length > 0 ? "" : placeholder}
                                    className={styles.input}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!open) setOpen(true)
                                    }}
                                />
                            </div>
                            {selected.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className={styles.icon}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onClear()
                                        setSearch("")
                                    }}
                                >
                                    <X size={16}/>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className={styles.icon}
                            >
                                <ChevronDown size={16}/>
                            </Button>
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
                        <Cmd.Empty className={styles.empty}>
                            No results found.
                        </Cmd.Empty>
                        <Cmd.List className={styles.list}>
                            {hasGroups
                                ? Array.from(grouped.entries()).map(
                                    ([group, groupItems], i) => (
                                        <React.Fragment key={group}>
                                            <Cmd.Group
                                                heading={group}
                                                className={styles.group}
                                            >
                                                {groupItems.map((item) => (
                                                    <Cmd.Item
                                                        key={item.key}
                                                        value={item.value}
                                                        data-checked={selected.some(
                                                            (s) =>
                                                                s.key ===
                                                                item.key,
                                                        )}
                                                        onSelect={() =>
                                                            handleSelect(item)
                                                        }
                                                        className={styles.item}
                                                    >
                                                        {item.label}
                                                        <CheckIcon
                                                            className={
                                                                styles.checkIcon
                                                            }
                                                        />
                                                    </Cmd.Item>
                                                ))}
                                            </Cmd.Group>
                                        </React.Fragment>
                                    ),
                                )
                                : (
                                    <Cmd.Group className={styles.group}>
                                        {items.map((item) => (
                                            <Cmd.Item
                                                key={item.key}
                                                value={item.value}
                                                data-checked={selected.some(
                                                    (s) =>
                                                        s.key === item.key,
                                                )}
                                                onSelect={() =>
                                                    handleSelect(item)
                                                }
                                                className={styles.item}
                                            >
                                                {item.label}
                                                <CheckIcon
                                                    className={
                                                        styles.checkIcon
                                                    }
                                                />
                                            </Cmd.Item>
                                        ))}
                                    </Cmd.Group>
                                )}
                        </Cmd.List>
                    </PopoverContent>
                </Popover>
            </Cmd>
        </div>
    )
}

export { FilterInput }
export type { FilterItem, FilterInputProps }

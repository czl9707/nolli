import { useCallback, useEffect } from "react"

export type SectionKey = "hero" | "index" | "closeup" | "cta" | "footer"

type VariantMeta = { key: string; name: string }

type PrototypeSwitcherProps = {
  sections: Record<SectionKey, VariantMeta[]>
  section: SectionKey
  variant: string
  onNavigate: (section: SectionKey, variant: string) => void
}

/**
 * PROTOTYPE ONLY — floating bottom bar. Arrows cycle variants within the
 * current section; tabs switch section. Never ship.
 */
export function PrototypeSwitcher({ sections, section, variant, onNavigate }: PrototypeSwitcherProps) {
  const variants = sections[section]
  const idx = Math.max(0, variants.findIndex((v) => v.key === variant))
  const current = variants[idx]

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const next = (idx + dir + variants.length) % variants.length
      onNavigate(section, variants[next].key)
    },
    [idx, variants, section, onNavigate],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return
      if (e.key === "ArrowRight") cycle(1)
      if (e.key === "ArrowLeft") cycle(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [cycle])

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(237,234,225,0.25)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        font: "600 12px var(--font-sans)",
        color: "#EDEAE1",
      }}
    >
      <button aria-label="previous variant" onClick={() => cycle(-1)} style={btn}>
        ◀
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 150 }}>
        <span>
          {section} · {current?.key} — {current?.name}
        </span>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {(Object.keys(sections) as SectionKey[]).map((s) => (
            <button
              key={s}
              onClick={() => onNavigate(s, sections[s][0].key)}
              style={{
                ...btn,
                padding: "2px 8px",
                borderRadius: 999,
                opacity: s === section ? 1 : 0.5,
                border: s === section ? "1px solid #EDEAE1" : "1px solid transparent",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <button aria-label="next variant" onClick={() => cycle(1)} style={btn}>
        ▶
      </button>
    </div>
  )
}

const btn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "inherit",
  font: "inherit",
  cursor: "pointer",
  padding: "4px 8px",
}

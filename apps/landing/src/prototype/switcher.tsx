// PROTOTYPE — floating variant switcher. Bottom-centre pill, arrows cycle,
// URL search param stays shareable. Dev-only.
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

export type VariantDef = {
  key: string
  name: string
  Component: () => React.JSX.Element
}

export function PrototypeSwitcher({
  variants,
  current,
  onSelect,
}: {
  variants: VariantDef[]
  current: VariantDef
  onSelect: (key: string) => void
}) {
  const cycle = useCallback(
    (dir: 1 | -1) => {
      const i = variants.findIndex((v) => v.key === current.key)
      const next = variants[(i + dir + variants.length) % variants.length]
      onSelect(next.key)
    },
    [variants, current, onSelect],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.key === "ArrowLeft") cycle(-1)
      if (e.key === "ArrowRight") cycle(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [cycle])

  if (import.meta.env.PROD) return null

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        translate: "-50% 0",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.75rem",
        borderRadius: 999,
        background: "#111",
        color: "#fff",
        font: "600 0.8rem/1 ui-sans-serif, system-ui, sans-serif",
        letterSpacing: "0.02em",
        boxShadow: "0 8px 24px rgb(0 0 0 / 0.35)",
        userSelect: "none",
      }}
    >
      <button onClick={() => cycle(-1)} style={btn} aria-label="previous variant">
        ←
      </button>
      <span>
        {current.key} — {current.name}
      </span>
      <button onClick={() => cycle(1)} style={btn} aria-label="next variant">
        →
      </button>
    </div>,
    document.body,
  )
}

const btn: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  padding: "0.25rem 0.5rem",
  borderRadius: 999,
  font: "inherit",
}

export function useVariantKey(variants: VariantDef[]) {
  const read = () => {
    const k = new URLSearchParams(window.location.search).get("variant") ?? variants[0].key
    return variants.some((v) => v.key === k) ? k : variants[0].key
  }
  const [key, setKey] = useState(read)

  useEffect(() => {
    const onPop = () => setKey(read())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = useCallback((k: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("variant", k)
    window.history.replaceState(null, "", url)
    setKey(k)
  }, [])

  return { key, select }
}

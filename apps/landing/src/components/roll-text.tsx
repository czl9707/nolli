import { useEffect, useRef, useState } from "react"
import styles from "./roll-text.module.css"

export function RollText({ text, className }: { text: string; className?: string }) {
  const [items, setItems] = useState<{ id: number; text: string }[]>(() => [{ id: 0, text }])
  const nextId = useRef(1)
  useEffect(() => {
    setItems((prev) =>
      prev.length && prev[prev.length - 1].text === text
        ? prev
        : [...prev.slice(-5), { id: nextId.current++, text }],
    )
  }, [text])
  // fallback prune: animationend delivery lags under main-thread congestion —
  // collapse to the in-flow face once the out roll (0.3s) has surely ended
  useEffect(() => {
    if (items.length < 2) return
    const t = setTimeout(() => setItems((prev) => prev.slice(-1)), 650)
    return () => clearTimeout(t)
  }, [items])
  return (
    <span className={[styles.clip, className].filter(Boolean).join(" ")}>
      {items.map((it, i) => {
        const out = i !== items.length - 1
        return (
          <span
            key={it.id}
            className={styles.face}
            data-roll={out ? "out" : "in"}
            aria-hidden={out || undefined}
            onAnimationEnd={out ? () => setItems((prev) => prev.filter((x) => x.id !== it.id)) : undefined}
          >
            {it.text}
          </span>
        )
      })}
    </span>
  )
}

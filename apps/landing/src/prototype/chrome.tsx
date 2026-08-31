// PROTOTYPE — shared content pieces across variants (same content as the
// current landing; only tone and placement vary). Variants position them via
// grid cells; these components carry no layout of their own beyond tone.
import { motion, useReducedMotion } from "framer-motion"
import { Body1, Body2, Body3, H1, H6, Button } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { APP_URL, CLUSTER_CITY } from "@/lib/constants"
import styles from "./chrome.module.css"

export type Tone = "onMap" | "onPaper"

export function PrototypeHeader({ tone = "onMap" }: { tone?: Tone }) {
  const t = tone === "onMap" ? styles.onMap : styles.onPaper
  return (
    <header className={`${styles.bar} ${t}`}>
      <div className={styles.row}>
        <a className={styles.brand} href="#" aria-label="Nolli home">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          <H6>Nolli</H6>
        </a>
        <div className={styles.right}>
          <nav className={styles.links} aria-label="site">
            <Body2 asChild>
              <a href="#">Poster</a>
            </Body2>
            <Body2 asChild>
              <a href="#">About</a>
            </Body2>
          </nav>
          <Button variant="outline" size="default" asChild>
            <a href={APP_URL}>Explore Nolli</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

const HEADLINE_LINES = [
  <>
    <span className={styles.accent}>Nolli</span> is a map
  </>,
  <>for architectures.</>,
]

export function HeroHeadline({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <H1 className={[styles.headline, className].filter(Boolean).join(" ")}>
      {HEADLINE_LINES.map((line, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: "easeOut" }}
        >
          {line}
        </motion.div>
      ))}
    </H1>
  )
}

export function PickList({
  picks,
  active,
}: {
  picks: ArchSummary[]
  active: ReadonlySet<string>
}) {
  const reduced = useReducedMotion()
  return (
    <motion.ul
      className={styles.pickList}
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
    >
      {picks.map((p) => (
        <Body3 asChild key={p.slug}>
          <li className={`${styles.pick} ${active.has(p.slug) ? styles.pickActive : ""}`}>
            {p.name}
          </li>
        </Body3>
      ))}
    </motion.ul>
  )
}

export function NearestCaption({ nearest }: { nearest: ArchSummary | null }) {
  return (
    <motion.div
      key={nearest?.slug ?? "none"}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Body1 asChild>
        <div className={styles.captionName}>{nearest?.name ?? ""}</div>
      </Body1>
      <Body2 asChild>
        <div className={styles.captionMeta}>
          {nearest ? `${nearest.architect}, ${nearest.year}` : ""}
        </div>
      </Body2>
    </motion.div>
  )
}

export function Statement({ className }: { className?: string }) {
  return (
    <Body1 asChild>
      <p className={`${styles.statement} ${className ?? ""}`}>
        Google Maps treats a masterpiece no differently.
        <br />
        ArchDaily curates everything about it.
        <br />
        <strong>Nolli pins it on the map.</strong>
        <br />
        <strong>Don't miss the masterpiece.</strong>
      </p>
    </Body1>
  )
}

export function CityList({
  cities,
  selected,
  loaded,
  onSelect,
}: {
  cities: readonly string[]
  selected: string
  loaded: string[]
  onSelect: (name: string) => void
}) {
  return (
    <ul className={styles.list} role="listbox" aria-label="Cities">
      {cities.map((name) => {
        const ready = loaded.includes(name)
        return (
          <Body2 asChild key={name}>
            <li
              className={[
                styles.rowItem,
                name === selected ? styles.rowActive : "",
                ready ? "" : styles.rowPending,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(name)}
            >
              {name}
            </li>
          </Body2>
        )
      })}
    </ul>
  )
}

export const HERO_CITY = CLUSTER_CITY

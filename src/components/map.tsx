import { Map, MapControls } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Theme } from "@/lib/map-texture/constant"
import { useLocation, useNavigate } from "react-router"
import { useLayout } from "@/hooks/use-layout"
import styles from "./map.module.css"
import portfolioStyles from "./layout/portfolio-item.module.css"
import { motion } from "framer-motion"

const PATTERNS = [
  { pattern: "water", id: "water-pattern" },
  { pattern: "grass", id: "grass-pattern" },
  { pattern: "forest", id: "forest-pattern" },
  { pattern: "building", id: "building-pattern" },
  { pattern: "landuse", id: "landuse-pattern" },
]

type CachedImage = HTMLImageElement | ImageBitmap

function patternUrl(pattern: string, theme: Theme) {
  return `/patterns/${theme}/${pattern}.png`
}

function applyImage(map: MapRef, id: string, data: CachedImage) {
  if (map.hasImage(id)) map.removeImage(id)
  map.addImage(id, data, { pixelRatio: 2 })
}

async function fetchAndCache(
  map: MapRef,
  theme: Theme,
  cache: Record<string, CachedImage>,
  apply: boolean,
) {
  await Promise.all(
    PATTERNS.map(async ({ pattern, id }) => {
      const key = `${theme}:${pattern}`
      let data = cache[key]
      if (!data) {
        const res = await map.loadImage(patternUrl(pattern, theme))
        data = res.data
        cache[key] = data
      }
      if (apply) applyImage(map, id, data)
    }),
  )
}

function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()
  const location = useLocation();

  const mapStyles = useMemo(() => ({
    light: getMapStyle("light"),
    dark: getMapStyle("dark"),
  }), [])

  const applyAllPatterns = useCallback((map: MapRef, theme: Theme) => {
    for (const { pattern, id } of PATTERNS) {
      const data = cacheRef.current[`${theme}:${pattern}`]
      if (data) applyImage(map, id, data)
    }
  }, [])

  const handleRef = useCallback((map: MapRef | null) => {
    if (!map) return
    mapRef.current = map

    const current: Theme = document.body.dataset.theme === "dark" ? "dark" : "light"
    const other: Theme = current === "dark" ? "light" : "dark"

    map.on("style.load", () => {
      const theme: Theme = document.body.dataset.theme === "dark" ? "dark" : "light"
      applyAllPatterns(map, theme)
    })

    map.on("click", () => {
      const isHome = location.pathname == "/";

      if (isHome) navigate("/arch/sample-building");
      else navigate("/");
    })

    fetchAndCache(map, current, cacheRef.current, true).then(() => {
      if (mapRef.current !== map) return
      setReady(true)
      fetchAndCache(map, other, cacheRef.current, false)
    })
  }, [applyAllPatterns, navigate])

  useEffect(() => {
    let prevDark = document.body.dataset.theme === "dark"
    const observer = new MutationObserver(async () => {
      const map = mapRef.current
      if (!map) return
      const dark = document.body.dataset.theme === "dark"
      if (dark === prevDark) return
      prevDark = dark
      const theme: Theme = dark ? "dark" : "light"
      applyAllPatterns(map, theme)
      await fetchAndCache(map, theme, cacheRef.current, true)
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [applyAllPatterns])

  return (
    <Map ref={handleRef} styles={mapStyles} loading={!ready}>
      <MapControls position="bottom-right" showZoom showLocate showFullscreen />
    </Map>
  )
}

const fadeVariants = {
  home: { opacity: 0, width: 0, height: 0, },
  portfolio: { opacity: 1, transition: { duration: 0.6, delay: 0.6 } },
}

function MapWrapper() {
  const mode = useLayout()

  return (
    <motion.div
      className={styles.wrapper}
      initial={mode}
      animate={mode}
      variants={{
        home: { width: "100%", maxWidth: "100%", transition: { duration: 0.6, delay: 0.6 } },
        portfolio: { width: 600, maxWidth: "100vw", padding: "4rem" },
      }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className={styles.grid}
        animate={mode}
        initial={mode}
        variants={{
          home: {
            gridTemplateColumns: "0fr 1fr",
            gridTemplateRows: "1fr 0fr",
            transition: { duration: 0.6, delay: 0.6 }
          },
          portfolio: {
            gridTemplateColumns: "1fr 2fr",
            gridTemplateRows: "2fr 1fr",
          },
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <motion.div
          className={styles.cell}
          animate={mode}
          initial={mode}
          variants={fadeVariants}
        >
          <h2>{"Seagram Building"}</h2>
        </motion.div>
        <div className={styles.cell}>
          <div className={styles.mapContainer}>
            <MapCore />
          </div>
        </div>
        <motion.div
          className={styles.cell}
          animate={mode}
          initial={mode}
          variants={fadeVariants}
        />
        <motion.div
          className={styles.cell}
          animate={mode}
          initial={mode}
          variants={fadeVariants}
        />
      </motion.div>
    </motion.div>
  )
}

export {
  MapWrapper as Map,
}

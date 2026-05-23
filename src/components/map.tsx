import { Map, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Theme } from "@/lib/map-texture/constant"
import { useLocation, useNavigate } from "react-router"
import { useLayout } from "@/hooks/use-layout"
import { useSelectedArch } from "@/contexts/selected-arch"
import { getAllArchitectures } from "@/data/architectures"
import styles from "./map.module.css"
import { motion } from "framer-motion"
import { H2, Body1, Body2 } from "./ui/typography"
import { MapPin } from "lucide-react"

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

const allArch = getAllArchitectures()

function ArchMarkers() {
  const navigate = useNavigate();
  const layout = useLayout();

  const handleClick = useCallback(
    (slug: string) => {
      navigate(`/arch/${slug}`)
    },
    [navigate],
  )

  return (
    <>
      {allArch.map((arch) => (
        <MapMarker
          key={arch.slug}
          longitude={arch.coordinates.longitude}
          latitude={arch.coordinates.latitude}
        >
          <MarkerContent>
            <MapPin style={{fill: "white"}}
              onClick={() => handleClick(arch.slug)}/>
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  )
}

function MapNavigator() {
  const { lastSelectedArch } = useSelectedArch();
  const { map } = useMap();

  useEffect(() => {
    if (!lastSelectedArch || !map) return
    setTimeout(() => {
        map.flyTo({
          center: [lastSelectedArch.coordinates.longitude, lastSelectedArch.coordinates.latitude],
          zoom: 16,
          duration: 1000,
        })
      }, 550)
    },
    [lastSelectedArch]
  );

  return undefined;
}

function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  const locationRef = useRef(location)
  locationRef.current = location

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
      if (locationRef.current.pathname !== "/") navigate("/")
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
      <MapControls showZoom showLocate showFullscreen />
      <ArchMarkers />
      <MapNavigator />
    </Map>
  )
}


function MapWrapper() {
  const mode = useLayout()
  const { lastSelectedArch } = useSelectedArch()

  return (
    <motion.div
      className={styles.wrapper}
      initial={mode}
      animate={mode}
      variants={{
        home: { width: "100%", maxWidth: "100%", padding: 0, transition: { duration: 0.6, delay: 0.6 } },
        portfolio: { width: 840, maxWidth: "100vw", padding: "2rem 8rem" },
      }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className={styles.grid}
        animate={mode}
        initial={mode}
        variants={{
          home: {
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr 0fr",
            rowGap: 0,
            transition: { duration: 0.6, delay: 0.6 }
          },
          portfolio: {
            gridTemplateColumns: "1fr",
            gridTemplateRows: "3fr 1fr",
            rowGap: "2rem",
          },
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className={styles.cell}>
          <div className={styles.mapContainer}>
            <MapCore />
          </div>
        </div>
        <motion.div
          className={`${styles.cell} ${styles.infoSection}`}
          animate={mode}
          initial={mode}
          variants={{
            home: { opacity: 0, transition: { duration: 0.6 } },
            portfolio: { opacity: 1, transition: { duration: 0.6, delay: 0.6 } },
          }}
        >
          <div className={styles.infoHead}>
            <Body1 className={styles.author}>
              {lastSelectedArch?.author ?? ""}
            </Body1>
            <Body2 className={styles.year}>
              {lastSelectedArch?.year ?? ""}
            </Body2>
          </div>
          <H2>{lastSelectedArch?.name ?? ""}</H2>
          <span style={{flex: "1 1"}}/>
          
          <Body2 className={styles.address}>
            {lastSelectedArch?.address ?? ""}
          </Body2>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export {
  MapWrapper as Map,
}

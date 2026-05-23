import { Map, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"
import { useLayout } from "@/hooks/use-layout"
import { useSelectedArch } from "@/contexts/selected-arch"
import { getAllArchitectures, type Arch } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import styles from "./map.module.css"
import { motion } from "framer-motion"
import { H2, Body1, Body2 } from "@/components/ui/typography"
import { MapPin } from "lucide-react"

const ALL_ARCHITECTURES = getAllArchitectures()

const NAV_DELAY_MS = 550

function flyToArch(map: MapRef, arch: Arch): void {
  map.flyTo({
    center: [arch.coordinates.longitude, arch.coordinates.latitude],
    zoom: 16,
    duration: 1000,
  })
}

function ArchMarkers() {
  const navigate = useNavigate()

  const handleClick = useCallback(
    (slug: string) => {
      navigate(`/arch/${slug}`)
    },
    [navigate],
  )

  return (
    <>
      {ALL_ARCHITECTURES.map((arch) => (
        <MapMarker
          key={arch.slug}
          longitude={arch.coordinates.longitude}
          latitude={arch.coordinates.latitude}
        >
          <MarkerContent>
            <MapPin style={{fill: "rgb(var(--color-accent-foreground))", stroke: "rgb(var(--color-primary-background) / .5)"}} size={30}
              onClick={() => handleClick(arch.slug)}/>
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  )
}

function MapNavigator() {
  const { lastSelectedArch } = useSelectedArch()
  const { map } = useMap()

  useEffect(() => {
    if (!lastSelectedArch || !map) return
    const id = setTimeout(() => flyToArch(map, lastSelectedArch), NAV_DELAY_MS)
    return () => clearTimeout(id)
  }, [lastSelectedArch, map])

  return null
}

function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  locationRef.current = location
  const { ready, initialize } = useMapPatterns(mapRef)

  const mapStyles = useMemo(() => ({
    light: getMapStyle("light"),
    dark: getMapStyle("dark"),
  }), [])

  const handleRef = useCallback((map: MapRef | null) => {
    if (!map) return
    mapRef.current = map
    map.on("click", () => {
      if (locationRef.current.pathname !== "/") navigate("/")
    })
    initialize(map)
  }, [navigate, initialize])

  return (
    <Map ref={handleRef} styles={mapStyles} loading={!ready}>
      <MapControls showZoom showLocate showFullscreen />
      <ArchMarkers />
      <MapNavigator />
    </Map>
  )
}

const EASE_TRANSITION = { duration: 0.6, ease: "easeInOut" as const }
const DELAY_TRANSITION = { duration: 0.6, delay: 0.6 }

const WRAPPER_VARIANTS = {
  home: {
    width: "100%",
    maxWidth: "100%",
    paddingTop: "0",
    paddingBottom: "0",
    paddingLeft: "0",
    paddingRight: "0",
    transition: DELAY_TRANSITION,
  },
  portfolio: {
    width: "var(--size-portfolio-width)",
    maxWidth: "100vw",
    paddingTop: "var(--spacing-component)",
    paddingBottom: "var(--spacing-component)",
    paddingLeft: "var(--spacing-block)",
    paddingRight: "var(--spacing-block)",
  },
}

const GRID_VARIANTS = {
  home: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr 0fr",
    rowGap: 0,
    transition: DELAY_TRANSITION,
  },
  portfolio: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "3fr 1fr",
    rowGap: "var(--spacing-component)",
  },
}

const INFO_VARIANTS = {
  home: { opacity: 0, transition: EASE_TRANSITION },
  portfolio: { opacity: 1, transition: DELAY_TRANSITION },
}

function MapWrapper() {
  const mode = useLayout()
  const { lastSelectedArch } = useSelectedArch()

  return (
    <motion.div
      className={styles.wrapper}
      initial={mode}
      animate={mode}
      variants={WRAPPER_VARIANTS}
      transition={EASE_TRANSITION}
    >
      <motion.div
        className={styles.grid}
        animate={mode}
        initial={mode}
        variants={GRID_VARIANTS}
        transition={EASE_TRANSITION}
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
          variants={INFO_VARIANTS}
        >
          <div className={styles.infoHead}>
            <Body1 className={styles.architect}>
              {lastSelectedArch?.architect ?? ""}
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

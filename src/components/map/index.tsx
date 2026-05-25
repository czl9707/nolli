import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useSelectedArch } from "@/contexts/selected-arch"
import { getAllArchitectures, type Arch } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import { ArrowRight, MapPin, X } from "lucide-react"
import { useLayout } from "@/hooks/use-layout"
import { H4, Body1, Body2 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./index.module.css"

const ALL_ARCHITECTURES = getAllArchitectures()

const NAV_DELAY_MS = 550

function flyToArch(map: MapRef, arch: Arch): void {
  map.flyTo({
    center: [arch.coordinates.longitude, arch.coordinates.latitude],
    zoom: 16,
    duration: 1000,
  })
}

function MapDrawer({
  arch,
  onView,
  onClose,
}: {
  arch: Arch
  onView: () => void
  onClose: () => void
}) {
  const cover = arch.pages[0]?.image

  return (
    <motion.div
      className={styles.drawerWrapper}
      initial={{ width: 0, paddingRight: 0 }}
      animate={{ width: 360, paddingRight: "var(--spacing-paragraph)"}}
      exit={{ width: 0, paddingRight: 0}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        className={styles.drawerContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.3 }}}
        exit={{ opacity: 0, transition: { duration: 0.6 }}}
      >
        <div className={styles.coverWrapper}>
          <Button className={styles.closeButton}
            variant="secondary" size="icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
          <img className={styles.cover} src={cover} alt={arch.name} />
        </div>
        <div className={styles.card} onClick={onView}>
          <H4 className={styles.heading}>{arch.name}</H4>
          <Body2 className={`${styles.detail} ${styles.address}`}>
            {arch.address}
          </Body2>
          <Body1 className={styles.detail}>
            By {arch.architect}, {arch.year}
          </Body1>
          <Button variant="link" className={styles.viewLink}>
            Pin Up ! <ArrowRight size={16} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ArchMarkers() {
  const { setLastSelectedArch } = useSelectedArch()

  return (
    <>
      {ALL_ARCHITECTURES.map((arch) => (
        <MapMarker
          key={arch.slug}
          longitude={arch.coordinates.longitude}
          latitude={arch.coordinates.latitude}
        >
          <MarkerContent>
            <MapPin
              style={{
                fill: "rgb(var(--color-accent-foreground))",
                stroke: "rgb(var(--color-primary-background) / .5)",
              }}
              size={30}
              onClick={() => setLastSelectedArch(arch)}
            />
          </MarkerContent>
        </MapMarker>
      ))}
    </>
  )
}

function MapNavigator() {
  const { lastSelectedArch } = useSelectedArch()
  const { map } = useMap()
  const mode = useLayout()

  useEffect(() => {
    if (!lastSelectedArch || !map || mode === "home") return
    const id = setTimeout(() => flyToArch(map, lastSelectedArch), NAV_DELAY_MS)
    return () => clearTimeout(id)
  }, [lastSelectedArch, map, mode])

  return null
}

export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready, initialize } = useMapPatterns(mapRef)
  const mode = useLayout()
  const { lastSelectedArch, setLastSelectedArch } = useSelectedArch()

  const mapStyles = useMemo(
    () => ({
      light: getMapStyle("light"),
      dark: getMapStyle("dark"),
    }),
    []
  )

  const handleRef = useCallback(
    (map: MapRef | null) => {
      if (!map) return
      mapRef.current = map
      initialize(map)
    },
    [navigate, initialize]
  )

  const isHome = mode === "home"
  const drawerOpen = isHome && lastSelectedArch !== null

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {drawerOpen && lastSelectedArch && (
          <MapDrawer
            key="drawer"
            arch={lastSelectedArch}
            onView={() => navigate(`/arch/${lastSelectedArch.slug}`)}
            onClose={() => setLastSelectedArch(null)}
          />
        )}
      </AnimatePresence>
      <div className={styles.mapWrapper}>
        <Map ref={handleRef} styles={mapStyles} loading={!ready}>
          {isHome && <MapControls showZoom showLocate showFullscreen />}
          <ArchMarkers />
          <MapNavigator />
        </Map>
      </div>
    </div>
  )
}

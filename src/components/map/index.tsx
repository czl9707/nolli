import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { useSelectedArch } from "@/contexts/selected-arch"
import { getAllArchitectures, type Arch } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import { MapPin } from "lucide-react"
import { useLayout } from "@/hooks/use-layout"
import { H4, Body1, Body2 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
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

function MapDrawer({ arch, onView, open }: { open: boolean, arch?: Arch; onView: () => void }) {
  const cover = arch?.pages[0]?.image;

  return (
    <div
      className={styles.drawerWrapper}
      data-open={open}
      onClick={(e) => e.stopPropagation()}
    >
      <img className={styles.cover} src={cover} alt={arch?.name} />
      <div className={styles.card} onClick={onView}>
        <H4 className={styles.heading}>{arch?.name}</H4>
        <Body2 className={`${styles.detail} ${styles.address}`}>
          {arch?.address}
        </Body2>
        <Body1 className={styles.detail}>
          By {arch?.architect}, {arch?.year}
        </Body1>
        <Button variant="link" className={styles.viewLink}>
          Pin Up ! <ArrowRight size={16} />
        </Button>
      </div>
    </div>
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
    if (!lastSelectedArch || !map || mode === "home")
      return
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
  const { lastSelectedArch } = useSelectedArch()

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
    [navigate]
  )

  const isHome = mode === "home"
  const drawerOpen = isHome && lastSelectedArch !== null

  return (
    <div className={styles.container}>
      <MapDrawer
        arch={lastSelectedArch}
        onView={() => lastSelectedArch && navigate(`/arch/${lastSelectedArch.slug}`)}
        open={drawerOpen}
      />
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

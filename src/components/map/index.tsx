import { Map, MapControls, MapMarker, MarkerContent, useMap } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"
import { useSelectedArch } from "@/contexts/selected-arch"
import { getAllArchitectures, type Arch } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
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
  const location = useLocation()

  useEffect(() => {
    if (!lastSelectedArch || !map || !location.pathname.startsWith("/arch/")) return
    const id = setTimeout(() => flyToArch(map, lastSelectedArch), NAV_DELAY_MS)
    return () => clearTimeout(id)
  }, [lastSelectedArch, map, location.key])

  return null
}

export function MapCore({ showControls = true }: { showControls?: boolean } = {}) {
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
      {showControls && <MapControls showZoom showLocate showFullscreen />}
      <ArchMarkers />
      <MapNavigator />
    </Map>
  )
}

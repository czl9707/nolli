import { useEffect, useRef } from "react"
import MapLibreGL from "maplibre-gl"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { ArchMap, ArchPinMarker, MapControls, useMap, flyToArchCinematic } from "@nolli/map"
import type { FormValues } from "./shape-payload"
import styles from "./coord-picker.module.css"

const DEFAULT_ZOOM = 15
const DEBOUNCE_MS = 500
const CLICK_SUPPRESS_MS = 250

function isCoordValid(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function MapBindings({ form }: { form: UseFormReturn<FormValues> }) {
  const { map, isLoaded } = useMap()
  const lat = useWatch({ control: form.control, name: "metadata.latitude" })
  const lng = useWatch({ control: form.control, name: "metadata.longitude" })

  const hasFlownRef = useRef(false)
  const lastFlownRef = useRef<{ lat: number; lng: number } | null>(null)
  const lastClickAtRef = useRef(0)

  // Map click → stamp the time and write both coords. The fly effect uses the
  // stamp to ignore the click's own two setValue writes (which React doesn't
  // batch, since the listener runs outside its event boundary).
  useEffect(() => {
    if (!map) return
    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      lastClickAtRef.current = performance.now()
      form.setValue("metadata.latitude", e.lngLat.lat, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.setValue("metadata.longitude", e.lngLat.lng, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    map.on("click", handleClick)
    return () => {
      map.off("click", handleClick)
    }
  }, [map, form])

  // Coord change → fly. Immediate on the first valid coord once the map is
  // ready, debounced thereafter so typing doesn't jitter the camera. Never on
  // a map click.
  useEffect(() => {
    // Skip until the map and its style are ready.
    if (!map || !isLoaded) return

    // Nothing to fly to.
    if (!isCoordValid(lat, lng)) return

    // A click just wrote these coords — the viewport is already there.
    if (performance.now() - lastClickAtRef.current < CLICK_SUPPRESS_MS) return

    // Already showing this exact spot.
    if (lastFlownRef.current?.lat === lat && lastFlownRef.current?.lng === lng)
      return

    const fly = () => {
      flyToArchCinematic(map, lng, lat, DEFAULT_ZOOM)
      lastFlownRef.current = { lat, lng }
    }

    if (!hasFlownRef.current) {
      hasFlownRef.current = true
      fly()
      return
    }

    const timer = setTimeout(fly, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [map, isLoaded, lat, lng])

  return null
}

export function CoordPicker({ form }: { form: UseFormReturn<FormValues> }) {
  const lat = form.watch("metadata.latitude")
  const lng = form.watch("metadata.longitude")
  const valid = isCoordValid(lat, lng)

  return (
    <div className={styles.map}>
      <ArchMap architectures={[]} ready={true}>
        <MapBindings form={form} />
        <MapControls showZoom />
        {valid && (
          <ArchPinMarker
            longitude={lng}
            latitude={lat}
            transition={{ duration: 0.3 }}
            className={styles.static}
          />
        )}
      </ArchMap>
    </div>
  )
}

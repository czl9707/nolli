import { useEffect, useRef } from "react"
import MapLibreGL from "maplibre-gl"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { ArchMap, ArchPinMarker, MapControls, useMap, flyToArchCinematic } from "@nolli/map"
import type { FormValues } from "./shape-payload"
import { decideFocus } from "./focus-decision"
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Click → stamp time, write both coords. The suppression window below keeps
  // the coord-change effect from flying on the click's own two setValue calls.
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

  // Coord change → decide whether to fly.
  useEffect(() => {
    if (!map) return

    const recentClick =
      performance.now() - lastClickAtRef.current < CLICK_SUPPRESS_MS
    const decision = decideFocus({
      mapReady: isLoaded,
      valid: isCoordValid(lat, lng),
      sameAsLastFlown:
        lastFlownRef.current?.lat === lat &&
        lastFlownRef.current?.lng === lng,
      hasFlown: hasFlownRef.current,
    })
    if (recentClick || decision === "none") return

    const fly = () => {
      flyToArchCinematic(map, lng, lat, DEFAULT_ZOOM)
      hasFlownRef.current = true
      lastFlownRef.current = { lat, lng }
    }
    if (decision === "now") fly()
    else timerRef.current = setTimeout(fly, DEBOUNCE_MS)

    // Clears the stale timer before each re-run and the pending timer on unmount.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
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

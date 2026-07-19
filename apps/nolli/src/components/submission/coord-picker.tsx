import { useEffect, useRef } from "react"
import MapLibreGL from "maplibre-gl"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { ArchMap, ArchPinMarker, MapControls, useMap } from "@nolli/map"
import { Caption } from "@nolli/ui"
import type { FormValues } from "./shape-payload"
import styles from "./coord-picker.module.css"

const DEFAULT_ZOOM = 15

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
  const { map } = useMap()
  const userPicked = useRef(false)
  const flewOnLoadRef = useRef(false)
  const lat = useWatch({ control: form.control, name: "metadata.latitude" })
  const lng = useWatch({ control: form.control, name: "metadata.longitude" })

  useEffect(() => {
    if (!map) return
    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      userPicked.current = true
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

  useEffect(() => {
    if (!map || flewOnLoadRef.current || userPicked.current) return
    if (!isCoordValid(lat, lng)) return
    flewOnLoadRef.current = true
    map.flyTo({ center: [lng, lat], zoom: DEFAULT_ZOOM })
  }, [map, lat, lng])

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

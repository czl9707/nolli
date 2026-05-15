"use client"

import MapLibreGL from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { MAP_STYLES } from "@/lib/map-styles"

const FALLBACK_CENTER: [number, number] = [0, 20]
const FALLBACK_ZOOM = 2
const USER_ZOOM = 14
const GEOLOCATION_TIMEOUT = 5000

type ArchMapProps = {
  className?: string
}

export function ArchMap({ className }: ArchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreGL.Map | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return

    const style = resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light

    if (!mapRef.current) {
      const map = new MapLibreGL.Map({
        container: containerRef.current,
        style,
        center: FALLBACK_CENTER,
        zoom: FALLBACK_ZOOM,
        attributionControl: { compact: true },
      })

      // map.addControl(new MapLibreGL.NavigationControl(), "bottom-right")

      map.on("load", () => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            map.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: USER_ZOOM,
              duration: 2000,
            })
          },
          () => {},
          { timeout: GEOLOCATION_TIMEOUT },
        )
      })

      mapRef.current = map
    } else {
      mapRef.current.setStyle(style, { diff: true })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [resolvedTheme])

  return (
    <div
      ref={containerRef}
      className={cn("h-dvh w-full", className)}
    />
  )
}

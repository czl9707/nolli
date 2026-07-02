import MapLibreGL, { type PopupOptions, type MarkerOptions } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { animate, type AnimationPlaybackControls, type Easing } from "framer-motion"
import { toast } from "sonner"
import { useThemeStore } from "@nolli/ui"
import {
  X,
  Minus,
  Plus,
  Locate,
  Maximize,
  Loader2,
  Compass,
} from "lucide-react"
import {
  MapContext,
  MarkerContext,
  useMap,
  useMarkerContext,
} from "./map-context"
import { Button } from "@nolli/ui"
import controlStyles from "./map-controls.module.css"
import mapCss from "./map.module.css"
import markerStyles from "./map-markers.module.css"

const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
}

/** Map viewport state */
type MapViewport = {
  /** Center coordinates [longitude, latitude] */
  center: [number, number]
  /** Zoom level */
  zoom: number
  /** Bearing (rotation) in degrees */
  bearing: number
  /** Pitch (tilt) in degrees */
  pitch: number
}

type MapStyleOption = string | MapLibreGL.StyleSpecification

type MapRef = MapLibreGL.Map

type MapProps = {
  children?: ReactNode
  /** Additional CSS classes for the map container */
  className?: string
  /** Custom map styles for light and dark themes. Overrides the default Carto styles. */
  styles?: {
    light?: MapStyleOption
    dark?: MapStyleOption
  }
  /** Map projection type. Use `{ type: "globe" }` for 3D globe view. */
  projection?: MapLibreGL.ProjectionSpecification
  /**
   * Controlled viewport. When provided with onViewportChange,
   * the map becomes controlled and viewport is driven by this prop.
   */
  viewport?: Partial<MapViewport>
  /**
   * Callback fired continuously as the viewport changes (pan, zoom, rotate, pitch).
   * Can be used standalone to observe changes, or with `viewport` prop
   * to enable controlled mode where the map viewport is driven by your state.
   */
  onViewportChange?: (viewport: MapViewport) => void
  /** Show a loading indicator on the map */
  loading?: boolean
} & Omit<MapLibreGL.MapOptions, "container" | "style">

function DefaultLoader() {
  return (
    <div className={mapCss.loader}>
      <div className={mapCss.loaderDots}>
        <span className={mapCss.dot1} />
        <span className={mapCss.dot2} />
        <span className={mapCss.dot3} />
      </div>
    </div>
  )
}

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter()
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }
}

const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    className,
    styles,
    projection,
    viewport,
    onViewportChange,
    loading = false,
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isStyleLoaded, setIsStyleLoaded] = useState(false)
  const currentStyleRef = useRef<MapStyleOption | null>(null)
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const internalUpdateRef = useRef(false)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

  const isControlled = viewport !== undefined && onViewportChange !== undefined

  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles]
  )

  // Expose the map instance to the parent component
  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance])

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current)
      styleTimeoutRef.current = null
    }
  }, [])

  // Initialize the map
  useEffect(() => {
    if (!containerRef.current) return

    const initialStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light
    currentStyleRef.current = initialStyle

    document.fonts.load("24px 'Architects Daughter'").then(() => {
      if (!containerRef.current) return
      const map = new MapLibreGL.Map({
        container: containerRef.current,
        style: initialStyle,
        renderWorldCopies: false,
        attributionControl: false,
        ...props,
        ...viewport,
      })

      const styleDataHandler = () => {
        clearStyleTimeout()
        styleTimeoutRef.current = setTimeout(() => {
          setIsStyleLoaded(true)
          if (projection) {
            map.setProjection(projection)
          }
        }, 100)
      }
      const loadHandler = () => setIsLoaded(true)

      const handleMove = () => {
        if (internalUpdateRef.current) return
        onViewportChangeRef.current?.(getViewport(map))
      }

      map.on("load", loadHandler)
      map.on("styledata", styleDataHandler)
      map.on("move", handleMove)
      setMapInstance(map)

      return () => {
        clearStyleTimeout()
        map.off("load", loadHandler)
        map.off("styledata", styleDataHandler)
        map.off("move", handleMove)
        map.remove()
        setIsLoaded(false)
        setIsStyleLoaded(false)
        setMapInstance(null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync controlled viewport to map
  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport) return
    if (mapInstance.isMoving()) return

    const current = getViewport(mapInstance)
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    }

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return
    }

    internalUpdateRef.current = true
    mapInstance.jumpTo(next)
    internalUpdateRef.current = false
  }, [mapInstance, isControlled, viewport])

  // Handle style change
  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return

    const newStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light

    if (currentStyleRef.current === newStyle) return

    clearStyleTimeout()
    currentStyleRef.current = newStyle
    setIsStyleLoaded(false)

    mapInstance.setStyle(newStyle, { diff: true })
  }, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout])

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
    }),
    [mapInstance, isLoaded, isStyleLoaded]
  )

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`${mapCss.container} ${className ?? ""}`}
      >
        {(!isLoaded || loading) && <DefaultLoader />}
        {/* SSR-safe: children render only when map is loaded on client */}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  )
})

type MarkerTransition = {
  duration?: number
  ease?: Easing
  delay?: number
}

type MapMarkerProps = {
  /** Longitude coordinate for marker position */
  longitude: number
  /** Latitude coordinate for marker position */
  latitude: number
  /** Marker subcomponents (MarkerContent, MarkerPopup, MarkerTooltip, MarkerLabel) */
  children: ReactNode
  /** When provided, position changes ease to the new lng/lat instead of jumping. */
  transition?: MarkerTransition
  /** Callback when marker is clicked */
  onClick?: (e: MouseEvent) => void
  /** Callback when mouse enters marker */
  onMouseEnter?: (e: MouseEvent) => void
  /** Callback when mouse leaves marker */
  onMouseLeave?: (e: MouseEvent) => void
  /** Stacking order among sibling markers — higher paints on top. */
  zIndex?: number
} & Omit<MarkerOptions, "element">

function MapMarker({
  longitude,
  latitude,
  transition,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  zIndex,
  ...markerOptions
}: MapMarkerProps) {
  const { map } = useMap()
  const easingControlsRef = useRef<AnimationPlaybackControls | null>(null)

  const callbacksRef = useRef({
    onClick,
    onMouseEnter,
    onMouseLeave,
  })
  callbacksRef.current = {
    onClick,
    onMouseEnter,
    onMouseLeave,
  }

  const marker = useMemo(() => {
    const markerInstance = new MapLibreGL.Marker({
      ...markerOptions,
      element: document.createElement("div"),
    }).setLngLat([longitude, latitude])

    const handleClick = (e: MouseEvent) => callbacksRef.current.onClick?.(e)
    const handleMouseEnter = (e: MouseEvent) =>
      callbacksRef.current.onMouseEnter?.(e)
    const handleMouseLeave = (e: MouseEvent) =>
      callbacksRef.current.onMouseLeave?.(e)

    markerInstance.getElement()?.addEventListener("click", handleClick)
    markerInstance
      .getElement()
      ?.addEventListener("mouseenter", handleMouseEnter)
    markerInstance
      .getElement()
      ?.addEventListener("mouseleave", handleMouseLeave)

    return markerInstance

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return

    marker.addTo(map)

    return () => {
      easingControlsRef.current?.stop()
      marker.remove()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  if (
    marker.getLngLat().lng !== longitude ||
    marker.getLngLat().lat !== latitude
  ) {
    if (transition) {
      // Ease to the new lng/lat (retarget-safe: stop any in-flight ease first).
      easingControlsRef.current?.stop()
      const start = marker.getLngLat()
      const fromLng = start.lng
      const fromLat = start.lat
      easingControlsRef.current = animate(0, 1, {
        duration: transition.duration,
        ease: transition.ease,
        delay: transition.delay,
        onUpdate: (t) => {
          marker.setLngLat([
            fromLng + (longitude - fromLng) * t,
            fromLat + (latitude - fromLat) * t,
          ])
        },
        onComplete: () => {
          marker.setLngLat([longitude, latitude])
          easingControlsRef.current = null
        },
      })
    } else {
      marker.setLngLat([longitude, latitude])
    }
  }

  const currentOffset = marker.getOffset()
  const newOffset = markerOptions.offset ?? [0, 0]
  const [newOffsetX, newOffsetY] = Array.isArray(newOffset)
    ? newOffset
    : [newOffset.x, newOffset.y]
  if (currentOffset.x !== newOffsetX || currentOffset.y !== newOffsetY) {
    marker.setOffset(newOffset)
  }

  if (marker.getRotation() !== markerOptions.rotation) {
    marker.setRotation(markerOptions.rotation ?? 0)
  }

  const element = marker.getElement()
  const z = zIndex != null ? String(zIndex) : ""
  if (element.style.zIndex !== z) {
    element.style.zIndex = z
  }
  if (marker.getRotationAlignment() !== markerOptions.rotationAlignment) {
    marker.setRotationAlignment(markerOptions.rotationAlignment ?? "auto")
  }
  if (marker.getPitchAlignment() !== markerOptions.pitchAlignment) {
    marker.setPitchAlignment(markerOptions.pitchAlignment ?? "auto")
  }

  return (
    <MarkerContext.Provider value={{ marker, map }}>
      {children}
    </MarkerContext.Provider>
  )
}

type MarkerContentProps = {
  /** Custom marker content. Defaults to a blue dot if not provided */
  children?: ReactNode
  /** Additional CSS classes for the marker container */
  className?: string
}

function MarkerContent({ children, className }: MarkerContentProps) {
  const { marker } = useMarkerContext()

  return createPortal(
    <div
      className={`${markerStyles.markerContent}${className ? ` ${className}` : ""}`}
    >
      {children || <DefaultMarkerIcon />}
    </div>,
    marker.getElement()
  )
}

function DefaultMarkerIcon() {
  return <div className={markerStyles.defaultMarker} />
}

function PopupCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close popup"
      className={markerStyles.popupClose}
    >
      <X className="size-3.5" />
    </button>
  )
}

type MarkerPopupProps = {
  /** Popup content */
  children: ReactNode
  /** Additional CSS classes for the popup container */
  className?: string
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean
} & Omit<PopupOptions, "className" | "closeButton">

function MarkerPopup({
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MarkerPopupProps) {
  const { marker, map } = useMarkerContext()
  const container = useMemo(() => document.createElement("div"), [])
  const prevPopupOptions = useRef(popupOptions)

  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setDOMContent(container)

    return popupInstance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return

    popup.setDOMContent(container)
    marker.setPopup(popup)

    return () => {
      marker.setPopup(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  if (popup.isOpen()) {
    const prev = prevPopupOptions.current

    if (prev.offset !== popupOptions.offset) {
      popup.setOffset(popupOptions.offset ?? 16)
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? "none")
    }

    prevPopupOptions.current = popupOptions
  }

  const handleClose = () => popup.remove()

  return createPortal(
    <div
      className={`${markerStyles.popup} ${className ? ` ${className}` : ""}`}
    >
      {closeButton && <PopupCloseButton onClick={handleClose} />}
      {children}
    </div>,
    container
  )
}

type MarkerTooltipProps = {
  /** Tooltip content */
  children: ReactNode
  /** Additional CSS classes for the tooltip container */
  className?: string
} & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">

function MarkerTooltip({
  children,
  className,
  ...popupOptions
}: MarkerTooltipProps) {
  const { marker, map } = useMarkerContext()
  const container = useMemo(() => document.createElement("div"), [])
  const prevTooltipOptions = useRef(popupOptions)

  const tooltip = useMemo(() => {
    const tooltipInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeOnClick: true,
      closeButton: false,
    }).setMaxWidth("none")

    return tooltipInstance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return

    tooltip.setDOMContent(container)

    const handleMouseEnter = () => {
      tooltip.setLngLat(marker.getLngLat()).addTo(map)
    }
    const handleMouseLeave = () => tooltip.remove()

    marker.getElement()?.addEventListener("mouseenter", handleMouseEnter)
    marker.getElement()?.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      marker.getElement()?.removeEventListener("mouseenter", handleMouseEnter)
      marker.getElement()?.removeEventListener("mouseleave", handleMouseLeave)
      tooltip.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  if (tooltip.isOpen()) {
    const prev = prevTooltipOptions.current

    if (prev.offset !== popupOptions.offset) {
      tooltip.setOffset(popupOptions.offset ?? 16)
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      tooltip.setMaxWidth(popupOptions.maxWidth ?? "none")
    }

    prevTooltipOptions.current = popupOptions
  }

  return createPortal(
    <div
      className={`${markerStyles.tooltip}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>,
    container
  )
}

type MarkerLabelProps = {
  /** Label text content */
  children: ReactNode
  /** Additional CSS classes for the label */
  className?: string
  /** Position of the label relative to the marker (default: "top") */
  position?: "top" | "bottom"
}

function MarkerLabel({
  children,
  className,
  position = "top",
}: MarkerLabelProps) {
  return (
    <div
      className={`${markerStyles.label} ${position === "top" ? markerStyles.labelTop : markerStyles.labelBottom}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  )
}

type MapControlsProps = {
  /** Position of the controls on the map (default: "bottom-right") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  /** Show zoom in/out buttons (default: true) */
  showZoom?: boolean
  /** Show compass button to reset bearing (default: false) */
  showCompass?: boolean
  /** Show locate button to find user's location (default: false) */
  showLocate?: boolean
  /** Show fullscreen toggle button (default: false) */
  showFullscreen?: boolean
  /** Additional CSS classes for the controls container */
  className?: string
  /** Callback with user coordinates when located */
  onLocate?: (coords: { longitude: number; latitude: number }) => void
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return <div className={controlStyles.controlGroup}>{children}</div>
}

function MapControls({
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate,
}: MapControlsProps) {
  const { map } = useMap()
  const [waitingForLocation, setWaitingForLocation] = useState(false)

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 })
  }, [map])

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 })
  }, [map])

  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 })
  }, [map])

  const handleLocate = useCallback(() => {
    setWaitingForLocation(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          }
          map?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 14,
            duration: 1500,
          })
          onLocate?.(coords)
          setWaitingForLocation(false)
        },
        (error) => {
          toast.error("Could not get your location", {
            description: error.message,
          })
          setWaitingForLocation(false)
        }
      )
    }
  }, [map, onLocate])

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer()
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }, [map])

  return (
    <div
      className={`${controlStyles.controls}${className ? ` ${className}` : ""}`}
    >
      {showZoom && (
        <ControlGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            <Minus />
          </Button>
        </ControlGroup>
      )}
      {showCompass && (
        <ControlGroup>
          <CompassButton onClick={handleResetBearing} />
        </ControlGroup>
      )}
      {showLocate && (
        <ControlGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLocate}
            aria-label="Find my location"
            disabled={waitingForLocation}
          >
            {waitingForLocation ? (
              <Loader2 className={controlStyles.spinning} />
            ) : (
              <Locate />
            )}
          </Button>
        </ControlGroup>
      )}
      {showFullscreen && (
        <ControlGroup>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <Maximize />
          </Button>
        </ControlGroup>
      )}
    </div>
  )
}

function CompassButton({ onClick }: { onClick: () => void }) {
  const { map } = useMap()
  const compassRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!map || !compassRef.current) return

    const compass = compassRef.current

    const updateRotation = () => {
      const bearing = map.getBearing()
      const pitch = map.getPitch()
      compass.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`
    }

    map.on("rotate", updateRotation)
    map.on("pitch", updateRotation)
    updateRotation()

    return () => {
      map.off("rotate", updateRotation)
      map.off("pitch", updateRotation)
    }
  }, [map])

  return (
    <Button onClick={onClick} variant="ghost" size="icon">
      <Compass ref={compassRef} />
    </Button>
  )
}

type MapPopupProps = {
  /** Longitude coordinate for popup position */
  longitude: number
  /** Latitude coordinate for popup position */
  latitude: number
  /** Callback when popup is closed */
  onClose?: () => void
  /** Popup content */
  children: ReactNode
  /** Additional CSS classes for the popup container */
  className?: string
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean
} & Omit<PopupOptions, "className" | "closeButton">

function MapPopup({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MapPopupProps) {
  const { map } = useMap()
  const popupOptionsRef = useRef(popupOptions)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const container = useMemo(() => document.createElement("div"), [])

  const popup = useMemo(() => {
    const popupInstance = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setLngLat([longitude, latitude])

    return popupInstance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return

    const onCloseProp = () => onCloseRef.current?.()

    popup.on("close", onCloseProp)

    popup.setDOMContent(container)
    popup.addTo(map)

    return () => {
      popup.off("close", onCloseProp)
      if (popup.isOpen()) {
        popup.remove()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  if (popup.isOpen()) {
    const prev = popupOptionsRef.current

    if (
      popup.getLngLat().lng !== longitude ||
      popup.getLngLat().lat !== latitude
    ) {
      popup.setLngLat([longitude, latitude])
    }

    if (prev.offset !== popupOptions.offset) {
      popup.setOffset(popupOptions.offset ?? 16)
    }
    if (prev.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popup.setMaxWidth(popupOptions.maxWidth ?? "none")
    }
    popupOptionsRef.current = popupOptions
  }

  const handleClose = () => {
    popup.remove()
  }

  return createPortal(
    <div className={`${markerStyles.popup}${className ? ` ${className}` : ""}`}>
      {closeButton && <PopupCloseButton onClick={handleClose} />}
      {children}
    </div>,
    container
  )
}

type MapRouteProps = {
  /** Optional unique identifier for the route layer */
  id?: string
  /** Array of [longitude, latitude] coordinate pairs defining the route */
  coordinates: [number, number][]
  /** Line color as CSS color value (default: "#4285F4") */
  color?: string
  /** Line width in pixels (default: 3) */
  width?: number
  /** Line opacity from 0 to 1 (default: 0.8) */
  opacity?: number
  /** Dash pattern [dash length, gap length] for dashed lines */
  dashArray?: [number, number]
  /** Callback when the route line is clicked */
  onClick?: () => void
  /** Callback when mouse enters the route line */
  onMouseEnter?: () => void
  /** Callback when mouse leaves the route line */
  onMouseLeave?: () => void
  /** Whether the route is interactive - shows pointer cursor on hover (default: true) */
  interactive?: boolean
}

function MapRoute({
  id: propId,
  coordinates,
  color = "#4285F4",
  width = 3,
  opacity = 0.8,
  dashArray,
  onClick,
  onMouseEnter,
  onMouseLeave,
  interactive = true,
}: MapRouteProps) {
  const { map, isLoaded } = useMap()
  const autoId = useId()
  const id = propId ?? autoId
  const sourceId = `route-source-${id}`
  const layerId = `route-layer-${id}`

  // Add source and layer on mount
  useEffect(() => {
    if (!isLoaded || !map) return

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      },
    })

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dashArray && { "line-dasharray": dashArray }),
      },
    })

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  // When coordinates change, update the source data
  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) return

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      })
    }
  }, [isLoaded, map, coordinates, sourceId])

  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return

    map.setPaintProperty(layerId, "line-color", color)
    map.setPaintProperty(layerId, "line-width", width)
    map.setPaintProperty(layerId, "line-opacity", opacity)
    if (dashArray) {
      map.setPaintProperty(layerId, "line-dasharray", dashArray)
    }
  }, [isLoaded, map, layerId, color, width, opacity, dashArray])

  // Handle click and hover events
  useEffect(() => {
    if (!isLoaded || !map || !interactive) return

    const handleClick = () => {
      onClick?.()
    }
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer"
      onMouseEnter?.()
    }
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ""
      onMouseLeave?.()
    }

    map.on("click", layerId, handleClick)
    map.on("mouseenter", layerId, handleMouseEnter)
    map.on("mouseleave", layerId, handleMouseLeave)

    return () => {
      map.off("click", layerId, handleClick)
      map.off("mouseenter", layerId, handleMouseEnter)
      map.off("mouseleave", layerId, handleMouseLeave)
    }
  }, [isLoaded, map, layerId, onClick, onMouseEnter, onMouseLeave, interactive])

  return null
}

/** A single arc to render inside <MapArc data={...}>. */
type MapArcDatum = {
  /** Unique identifier for this arc. Required for hover state tracking and event payloads. */
  id: string | number
  /** Start coordinate as [longitude, latitude]. */
  from: [number, number]
  /** End coordinate as [longitude, latitude]. */
  to: [number, number]
}

/** Event payload passed to MapArc interaction callbacks. */
type MapArcEvent<T extends MapArcDatum = MapArcDatum> = {
  /** The arc datum that was hovered or clicked. */
  arc: T
  /** Longitude of the cursor at the time of the event. */
  longitude: number
  /** Latitude of the cursor at the time of the event. */
  latitude: number
  /** The underlying MapLibre mouse event for advanced use cases. */
  originalEvent: MapLibreGL.MapMouseEvent
}

type MapArcLinePaint = NonNullable<MapLibreGL.LineLayerSpecification["paint"]>
type MapArcLineLayout = NonNullable<MapLibreGL.LineLayerSpecification["layout"]>

type MapArcProps<T extends MapArcDatum = MapArcDatum> = {
  /** Array of arcs to render. Each arc must have a unique `id`. */
  data: T[]
  /** Optional unique identifier prefix for the arc source/layers. Auto-generated if not provided. */
  id?: string
  /**
   * How far each arc bows away from a straight line. `0` renders straight
   * lines; higher values bend further. Negative values bend to the opposite
   * side. Arcs are computed as a quadratic Bézier in lng/lat space and do not
   * account for the antimeridian. (default: 0.2)
   */
  curvature?: number
  /** Number of samples used to render each curve. Higher = smoother. (default: 64) */
  samples?: number
  /**
   * MapLibre paint properties for the arc layer. Merged on top of sensible
   * defaults (`line-color: #4285F4`, `line-width: 2`, `line-opacity: 0.85`).
   * Any value can be a MapLibre expression for per-feature styling, every
   * field on each arc datum (besides `from`/`to`) is exposed via `["get", ...]`.
   */
  paint?: MapArcLinePaint
  /** MapLibre layout properties for the arc layer. Defaults to rounded joins/caps. */
  layout?: MapArcLineLayout
  /**
   * Paint properties applied to the arc currently under the cursor. Each key
   * is merged into `paint` as a `case` expression keyed on per-feature hover
   * state, so only the hovered arc changes appearance.
   */
  hoverPaint?: MapArcLinePaint
  /** Callback when an arc is clicked. */
  onClick?: (e: MapArcEvent<T>) => void
  /**
   * Callback fired when the hovered arc changes. Receives the cursor's
   * lng/lat at the moment of entry, and `null` when the cursor leaves the
   * last hovered arc.
   */
  onHover?: (e: MapArcEvent<T> | null) => void
  /** Whether arcs respond to mouse events (default: true). */
  interactive?: boolean
  /** Optional MapLibre layer id to insert the arc layers before (z-order control). */
  beforeId?: string
}

const DEFAULT_ARC_CURVATURE = 0.2
const DEFAULT_ARC_SAMPLES = 64
const ARC_HIT_MIN_WIDTH = 12
const ARC_HIT_PADDING = 6

const DEFAULT_ARC_PAINT: MapArcLinePaint = {
  "line-color": "#4285F4",
  "line-width": 2,
  "line-opacity": 0.85,
}

const DEFAULT_ARC_LAYOUT: MapArcLineLayout = {
  "line-join": "round",
  "line-cap": "round",
}

function mergeArcPaint(
  paint: MapArcLinePaint,
  hoverPaint: MapArcLinePaint | undefined
): MapArcLinePaint {
  if (!hoverPaint) return paint
  const merged: Record<string, unknown> = { ...paint }
  for (const [key, hoverValue] of Object.entries(hoverPaint)) {
    if (hoverValue === undefined) continue
    const baseValue = merged[key]
    merged[key] =
      baseValue === undefined
        ? hoverValue
        : [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            hoverValue,
            baseValue,
          ]
  }
  return merged as MapArcLinePaint
}

function buildArcCoordinates(
  from: [number, number],
  to: [number, number],
  curvature: number,
  samples: number
): [number, number][] {
  const [x0, y0] = from
  const [x2, y2] = to
  const dx = x2 - x0
  const dy = y2 - y0
  const distance = Math.hypot(dx, dy)

  if (distance === 0 || curvature === 0) return [from, to]

  const mx = (x0 + x2) / 2
  const my = (y0 + y2) / 2
  const nx = -dy / distance
  const ny = dx / distance
  const offset = distance * curvature
  const cx = mx + nx * offset
  const cy = my + ny * offset

  const points: [number, number][] = []
  const segments = Math.max(2, Math.floor(samples))
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const inv = 1 - t
    const x = inv * inv * x0 + 2 * inv * t * cx + t * t * x2
    const y = inv * inv * y0 + 2 * inv * t * cy + t * t * y2
    points.push([x, y])
  }
  return points
}

function MapArc<T extends MapArcDatum = MapArcDatum>({
  data,
  id: propId,
  curvature = DEFAULT_ARC_CURVATURE,
  samples = DEFAULT_ARC_SAMPLES,
  paint,
  layout,
  hoverPaint,
  onClick,
  onHover,
  interactive = true,
  beforeId,
}: MapArcProps<T>) {
  const { map, isLoaded } = useMap()
  const autoId = useId()
  const id = propId ?? autoId
  const sourceId = `arc-source-${id}`
  const layerId = `arc-layer-${id}`
  const hitLayerId = `arc-hit-layer-${id}`

  const mergedPaint = useMemo(
    () => mergeArcPaint({ ...DEFAULT_ARC_PAINT, ...paint }, hoverPaint),
    [paint, hoverPaint]
  )
  const mergedLayout = useMemo(
    () => ({ ...DEFAULT_ARC_LAYOUT, ...layout }),
    [layout]
  )

  const hitWidth = useMemo(() => {
    const w = paint?.["line-width"] ?? DEFAULT_ARC_PAINT["line-width"]
    const base = typeof w === "number" ? w : ARC_HIT_MIN_WIDTH
    return Math.max(base + ARC_HIT_PADDING, ARC_HIT_MIN_WIDTH)
  }, [paint])

  const geoJSON = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(
    () => ({
      type: "FeatureCollection",
      features: data.map((arc) => {
        const { from, to, ...properties } = arc
        return {
          type: "Feature",
          properties,
          geometry: {
            type: "LineString",
            coordinates: buildArcCoordinates(from, to, curvature, samples),
          },
        }
      }),
    }),
    [data, curvature, samples]
  )

  const latestRef = useRef({ data, onClick, onHover })
  latestRef.current = { data, onClick, onHover }

  // Add source and layers on mount.
  useEffect(() => {
    if (!isLoaded || !map) return

    map.addSource(sourceId, {
      type: "geojson",
      data: geoJSON,
      promoteId: "id",
    })

    map.addLayer(
      {
        id: hitLayerId,
        type: "line",
        source: sourceId,
        layout: DEFAULT_ARC_LAYOUT,
        paint: {
          "line-color": "rgba(0, 0, 0, 0)",
          "line-width": hitWidth,
          "line-opacity": 1,
        },
      },
      beforeId
    )

    map.addLayer(
      {
        id: layerId,
        type: "line",
        source: sourceId,
        layout: mergedLayout,
        paint: mergedPaint,
      },
      beforeId
    )

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getLayer(hitLayerId)) map.removeLayer(hitLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  // Sync features when data / curvature / samples change.
  useEffect(() => {
    if (!isLoaded || !map) return
    const source = map.getSource(sourceId) as
      | MapLibreGL.GeoJSONSource
      | undefined
    source?.setData(geoJSON)
  }, [isLoaded, map, geoJSON, sourceId])

  // Sync paint/layout when they change.
  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return
    for (const [key, value] of Object.entries(mergedPaint)) {
      map.setPaintProperty(
        layerId,
        key as keyof MapArcLinePaint,
        value as never
      )
    }
    for (const [key, value] of Object.entries(mergedLayout)) {
      map.setLayoutProperty(
        layerId,
        key as keyof MapArcLineLayout,
        value as never
      )
    }
    if (map.getLayer(hitLayerId)) {
      map.setPaintProperty(hitLayerId, "line-width", hitWidth)
    }
  }, [isLoaded, map, layerId, hitLayerId, mergedPaint, mergedLayout, hitWidth])

  // Interaction handlers
  useEffect(() => {
    if (!isLoaded || !map || !interactive) return

    let hoveredId: string | number | null = null

    const setHover = (next: string | number | null) => {
      if (next === hoveredId) return
      const sourceExists = !!map.getSource(sourceId)
      if (hoveredId != null && sourceExists) {
        map.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: false }
        )
      }
      hoveredId = next
      if (next != null && sourceExists) {
        map.setFeatureState({ source: sourceId, id: next }, { hover: true })
      }
    }

    const findArc = (featureId: string | number | undefined) =>
      featureId == null
        ? undefined
        : latestRef.current.data.find(
            (arc) => String(arc.id) === String(featureId)
          )

    const handleMouseMove = (e: MapLibreGL.MapLayerMouseEvent) => {
      const featureId = e.features?.[0]?.id as string | number | undefined
      if (featureId == null || featureId === hoveredId) return

      setHover(featureId)
      map.getCanvas().style.cursor = "pointer"

      const arc = findArc(featureId)
      if (arc) {
        latestRef.current.onHover?.({
          arc: arc as T,
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
          originalEvent: e,
        })
      }
    }

    const handleMouseLeave = () => {
      setHover(null)
      map.getCanvas().style.cursor = ""
      latestRef.current.onHover?.(null)
    }

    const handleClick = (e: MapLibreGL.MapLayerMouseEvent) => {
      const arc = findArc(e.features?.[0]?.id as string | number | undefined)
      if (!arc) return
      latestRef.current.onClick?.({
        arc: arc as T,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        originalEvent: e,
      })
    }

    map.on("mousemove", hitLayerId, handleMouseMove)
    map.on("mouseleave", hitLayerId, handleMouseLeave)
    map.on("click", hitLayerId, handleClick)

    return () => {
      map.off("mousemove", hitLayerId, handleMouseMove)
      map.off("mouseleave", hitLayerId, handleMouseLeave)
      map.off("click", hitLayerId, handleClick)
      setHover(null)
      map.getCanvas().style.cursor = ""
    }
  }, [isLoaded, map, hitLayerId, sourceId, interactive])

  return null
}

export {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  MapRoute,
  MapArc,
}

export type { MapRef, MapViewport, MapArcDatum, MapArcEvent }

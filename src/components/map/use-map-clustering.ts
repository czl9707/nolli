import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react"
import Supercluster from "supercluster"
import type MapLibreGL from "maplibre-gl"
import type { ArchSummary } from "@/lib/data/architectures.type"

type ArchProperties = {
  slug: string
  name: string
}

type ClusterProperties = Supercluster.ClusterProperties & ArchProperties

export type ClusterPoint =
  | {
      type: "point"
      slug: string
      name: string
      coordinates: [number, number]
    }
  | {
      type: "cluster"
      id: number
      count: number
      coordinates: [number, number]
    }

export function getExpansionZoom(
  index: Supercluster<ArchProperties, ClusterProperties> | null,
  clusterId: number,
): number {
  if (!index) return 14
  return index.getClusterExpansionZoom(clusterId)
}

type LngLat = [number, number]

/**
 * Per-arch transition targets, handed to markers imperatively via a ref so they
 * survive the batched moveend/zoomend at the end of a flyTo (a prop-based value
 * got dropped on the 2nd recompute). Markers read these once:
 *  - `from`: cluster centroid a pin emerged from — enter-slide origin (on mount).
 *  - `to`:   cluster centroid a pin is collapsing into — exit-slide destination
 *            (on exit; the marker consumes/deletes it).
 */
export type MarkerTransitions = Record<
  string,
  { from?: LngLat; to?: LngLat }
>

type ArchState = { clustered: boolean; position: LngLat }

type RawMarker = { slug: string; name: string; coords: LngLat }
type RawCluster = { id: number; count: number; coords: LngLat }

export function useMapClustering(
  map: MapLibreGL.Map | null,
  architectures: ArchSummary[],
): {
  clusters: ClusterPoint[]
  getExpansionZoom: (clusterId: number, coordinates?: LngLat) => number
  transitions: MutableRefObject<MarkerTransitions>
} {
  const [clusters, setClusters] = useState<ClusterPoint[]>([])
  const indexRef = useRef<Supercluster<ArchProperties, ClusterProperties> | null>(
    null,
  )
  /** Per-arch state from the last recompute — used to detect transitions. */
  const archStateRef = useRef<Record<string, ArchState>>({})
  /** Enter/exit origins handed to markers. The hook writes; markers consume. */
  const transitionsRef = useRef<MarkerTransitions>({})

  // Build (or rebuild) the supercluster index when the architecture set changes.
  useEffect(() => {
    indexRef.current = new Supercluster<ArchProperties, ClusterProperties>({
      radius: 50,
      maxZoom: 14,
    })

    const points: GeoJSON.Feature<GeoJSON.Point, ArchProperties>[] =
      architectures.map((arch) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [arch.coordinates.lng, arch.coordinates.lat],
        },
        properties: { slug: arch.slug, name: arch.name },
      }))

    indexRef.current.load(points)
    archStateRef.current = {}
    transitionsRef.current = {}
  }, [architectures])

  // Recompute on map movement.
  useEffect(() => {
    if (!map || !indexRef.current) return

    const update = () => {
      const index = indexRef.current
      if (!index) return

      const bounds = map.getBounds()
      const zoom = Math.floor(map.getZoom())
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]

      const results = index.getClusters(bbox, zoom)

      const individual: RawMarker[] = []
      const rawClusters: RawCluster[] = []
      const newArchState: Record<string, ArchState> = {}

      for (const feature of results) {
        const [lng, lat] = feature.geometry.coordinates as LngLat
        if ("cluster" in feature.properties && feature.properties.cluster) {
          const props = feature.properties as Supercluster.ClusterProperties &
            ArchProperties
          const centroid: LngLat = [lng, lat]
          rawClusters.push({
            id: props.cluster_id,
            count: props.point_count,
            coords: centroid,
          })
          // Record each leaf as clustered at this centroid (keeps lastPosition fresh).
          const leaves = index.getLeaves(props.cluster_id, Infinity) as Array<
            GeoJSON.Feature<GeoJSON.Point, ArchProperties>
          >
          for (const leaf of leaves) {
            newArchState[leaf.properties.slug] = {
              clustered: true,
              position: centroid,
            }
          }
        } else {
          const props = feature.properties as ArchProperties
          individual.push({
            slug: props.slug,
            name: props.name,
            coords: [lng, lat],
          })
          newArchState[props.slug] = {
            clustered: false,
            position: [lng, lat],
          }
        }
      }

      // Detect transitions vs previous state; hand origins to markers via the ref.
      const prev = archStateRef.current
      const transitions = transitionsRef.current
      for (const [slug, ns] of Object.entries(newArchState)) {
        const ps = prev[slug]
        if (!ns.clustered && ps?.clustered) {
          // Emerging from a cluster -> enter-slide from the centroid it was at.
          transitions[slug] = { ...transitions[slug], from: ps.position }
        } else if (ns.clustered && ps && !ps.clustered) {
          // Collapsing into a cluster -> exit-slide to the new centroid.
          transitions[slug] = { ...transitions[slug], to: ns.position }
        }
      }
      // Drop entries for slugs no longer on-screen, so a stale `from` can't
      // re-trigger a slide if the pin later scrolls back into view.
      for (const slug of Object.keys(transitions)) {
        if (!(slug in newArchState)) delete transitions[slug]
      }

      archStateRef.current = newArchState

      const points: ClusterPoint[] = individual.map((p) => ({
        type: "point",
        slug: p.slug,
        name: p.name,
        coordinates: p.coords,
      }))
      const clusterPoints: ClusterPoint[] = rawClusters.map((c) => ({
        type: "cluster",
        id: c.id,
        count: c.count,
        coordinates: c.coords,
      }))
      setClusters([...points, ...clusterPoints])
    }

    update()
    map.on("moveend", update)
    map.on("zoomend", update)

    return () => {
      map.off("moveend", update)
      map.off("zoomend", update)
    }
  }, [map, architectures])

  const expandZoom = useCallback(
    (clusterId: number, _coordinates?: LngLat) =>
      getExpansionZoom(indexRef.current, clusterId),
    [],
  )

  return { clusters, getExpansionZoom: expandZoom, transitions: transitionsRef }
}

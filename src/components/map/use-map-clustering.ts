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
 * Per-marker transition targets, handed to markers imperatively via a ref so they
 * survive the batched moveend/zoomend at the end of a flyTo (a prop-based value
 * got dropped on the 2nd recompute). Keyed by the marker's React key — a slug for
 * points, `cluster-${id}` for clusters. Markers read these once:
 *  - `from`: position to enter-slide from (read on mount).
 *  - `to`:   position to exit-slide to (read + consumed on exit).
 */
export type MarkerTransitions = Record<
  string,
  { from?: LngLat; to?: LngLat }
>

type ArchState = { clustered: boolean; position: LngLat }

type RawMarker = { slug: string; name: string; coords: LngLat }
type RawCluster = { id: number; count: number; coords: LngLat }

type ClusterInfo = { centroid: LngLat; childIds: number[] }

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
  /** Per-arch state from the last recompute — used to detect point transitions. */
  const archStateRef = useRef<Record<string, ArchState>>({})
  /** Per-cluster tree info from the last recompute — used to detect cluster
   *  transitions (splits/merges) via parent↔child links. */
  const clusterInfoRef = useRef<Record<number, ClusterInfo>>({})
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
    clusterInfoRef.current = {}
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

      const transitions = transitionsRef.current

      // --- Point transitions: enter from / exit to a cluster centroid. ---
      const prevArch = archStateRef.current
      for (const [slug, ns] of Object.entries(newArchState)) {
        const ps = prevArch[slug]
        if (!ns.clustered && ps?.clustered) {
          transitions[slug] = { ...transitions[slug], from: ps.position }
        } else if (ns.clustered && ps && !ps.clustered) {
          transitions[slug] = { ...transitions[slug], to: ns.position }
        }
      }
      // Drop point entries for slugs no longer on-screen (prevents a stale `from`
      // re-triggering a slide if the pin later scrolls back into view).
      for (const key of Object.keys(transitions)) {
        if (key.startsWith("cluster-")) continue
        if (!(key in newArchState)) delete transitions[key]
      }

      // --- Cluster transitions (splits/merges), same pattern as points. ---
      // Build this zoom's cluster tree (each cluster + the cluster-ids it splits
      // into one level down) so we can link children to parents across a zoom step.
      const newClusterInfo: Record<number, ClusterInfo> = {}
      for (const c of rawClusters) {
        const children = index.getChildren(c.id, Infinity)
        newClusterInfo[c.id] = {
          centroid: c.coords,
          childIds: children
            .filter((ch) => ch.properties.cluster)
            .map((ch) => ch.properties.cluster_id),
        }
      }
      const prevClusterInfo = clusterInfoRef.current
      // Split: a new cluster that was a child of a previous cluster slides out of it.
      for (const c of rawClusters) {
        if (prevClusterInfo[c.id]) continue
        const parent = Object.values(prevClusterInfo).find((info) =>
          info.childIds.includes(c.id),
        )
        if (parent) {
          const key = `cluster-${c.id}`
          transitions[key] = { ...transitions[key], from: parent.centroid }
        }
      }
      // Merge: a disappeared cluster that is now a child of a new cluster slides
      // into it. A disappeared cluster with no merge target just leaves (fade).
      for (const [pidStr, info] of Object.entries(prevClusterInfo)) {
        const pid = Number(pidStr)
        if (pid in newClusterInfo) continue
        const into = rawClusters.find((c) =>
          newClusterInfo[c.id].childIds.includes(pid),
        )
        const key = `cluster-${pid}`
        if (into) {
          transitions[key] = { ...transitions[key], to: into.coords }
        } else {
          delete transitions[key]
        }
      }
      clusterInfoRef.current = newClusterInfo

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

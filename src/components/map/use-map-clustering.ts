import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
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

type ClusterResult = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>

// --- Pure helpers (one job each, no React) ---------------------------------

/** Visible map bounds as a supercluster bbox: [west, south, east, north]. */
function viewportBBox(
  map: MapLibreGL.Map,
): [number, number, number, number] {
  const b = map.getBounds()
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
}

/**
 * Split supercluster results into individual markers, raw clusters, and per-arch
 * state. Each clustered arch is recorded at its cluster's centroid so its
 * "emerge-from" origin stays fresh across recomputes.
 */
function collectMarkers(
  index: Supercluster<ArchProperties, ClusterProperties>,
  results: ClusterResult[],
): {
  individual: RawMarker[]
  rawClusters: RawCluster[]
  archState: Record<string, ArchState>
} {
  const individual: RawMarker[] = []
  const rawClusters: RawCluster[] = []
  const archState: Record<string, ArchState> = {}

  for (const feature of results) {
    const [lng, lat] = feature.geometry.coordinates as LngLat
    const isCluster =
      "cluster" in feature.properties && feature.properties.cluster
    if (isCluster) {
      const props = feature.properties as Supercluster.ClusterProperties &
        ArchProperties
      const centroid: LngLat = [lng, lat]
      rawClusters.push({
        id: props.cluster_id,
        count: props.point_count,
        coords: centroid,
      })
      const leaves = index.getLeaves(props.cluster_id, Infinity) as Array<
        GeoJSON.Feature<GeoJSON.Point, ArchProperties>
      >
      for (const leaf of leaves) {
        archState[leaf.properties.slug] = {
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
      archState[props.slug] = { clustered: false, position: [lng, lat] }
    }
  }

  return { individual, rawClusters, archState }
}

/**
 * Detect point transitions (clustered↔individual) vs the previous recompute and
 * record `from`/`to` slide origins. Prunes entries for slugs that left the
 * viewport so a stale `from` can't re-trigger a slide on scroll-back.
 */
function applyPointTransitions(
  transitions: MarkerTransitions,
  archState: Record<string, ArchState>,
  prevArchState: Record<string, ArchState>,
): void {
  for (const [slug, ns] of Object.entries(archState)) {
    const ps = prevArchState[slug]
    if (!ns.clustered && ps?.clustered) {
      transitions[slug] = { from: ps.position }
    } else if (ns.clustered && ps && !ps.clustered) {
      transitions[slug] = { to: ns.position }
    }
  }
  for (const key of Object.keys(transitions)) {
    if (key.startsWith("cluster-")) continue
    if (!(key in archState)) delete transitions[key]
  }
}

/** One-level cluster tree: each cluster + the cluster-ids it splits into down a
 *  zoom step. Used to link children to parents across a zoom change. */
function buildClusterTree(
  index: Supercluster<ArchProperties, ClusterProperties>,
  rawClusters: RawCluster[],
): Record<number, ClusterInfo> {
  const info: Record<number, ClusterInfo> = {}
  for (const c of rawClusters) {
    const childIds = index
      .getChildren(c.id)
      .filter((ch) => "cluster" in ch.properties)
      .map(
        (ch) =>
          (ch.properties as Supercluster.ClusterProperties).cluster_id,
      )
    info[c.id] = { centroid: c.coords, childIds }
  }
  return info
}

/**
 * Detect cluster transitions (splits/merges) via parent↔child links and record
 * `from`/`to` slide origins — the same pattern as points. A new cluster that was
 * a child of a previous one slides out of it (split); a disappeared cluster that
 * is now a child of a new one slides into it (merge); a disappeared cluster with
 * no merge target just leaves (fade).
 */
function applyClusterTransitions(
  transitions: MarkerTransitions,
  rawClusters: RawCluster[],
  clusterInfo: Record<number, ClusterInfo>,
  prevClusterInfo: Record<number, ClusterInfo>,
): void {
  for (const c of rawClusters) {
    if (prevClusterInfo[c.id]) continue
    const parent = Object.values(prevClusterInfo).find((p) =>
      p.childIds.includes(c.id),
    )
    if (parent) {
      const key = `cluster-${c.id}`
      transitions[key] = { ...transitions[key], from: parent.centroid }
    }
  }
  for (const [pidStr] of Object.entries(prevClusterInfo)) {
    const pid = Number(pidStr)
    if (pid in clusterInfo) continue
    const into = rawClusters.find((c) => clusterInfo[c.id].childIds.includes(pid))
    const key = `cluster-${pid}`
    if (into) {
      transitions[key] = { ...transitions[key], to: into.coords }
    } else {
      delete transitions[key]
    }
  }
}

/** Flatten collected markers/clusters into the ClusterPoint[] the UI renders. */
function toClusterPoints(
  individual: RawMarker[],
  rawClusters: RawCluster[],
): ClusterPoint[] {
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
  return [...points, ...clusterPoints]
}

// --- Hook ------------------------------------------------------------------

export function useMapClustering(
  map: MapLibreGL.Map | null,
  architectures: ArchSummary[],
): {
  clusters: ClusterPoint[]
  getExpansionZoom: (clusterId: number, coordinates?: LngLat) => number
  transitions: RefObject<MarkerTransitions>
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

      const results = index.getClusters(viewportBBox(map), Math.floor(map.getZoom()))
      const { individual, rawClusters, archState } = collectMarkers(index, results)

      const transitions = transitionsRef.current
      applyPointTransitions(transitions, archState, archStateRef.current)
      const clusterInfo = buildClusterTree(index, rawClusters)
      applyClusterTransitions(
        transitions,
        rawClusters,
        clusterInfo,
        clusterInfoRef.current,
      )

      archStateRef.current = archState
      clusterInfoRef.current = clusterInfo
      setClusters(toClusterPoints(individual, rawClusters))
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
      getExpansionZoom(indexRef.current, clusterId) + 2,
    [],
  )

  return { clusters, getExpansionZoom: expandZoom, transitions: transitionsRef }
}

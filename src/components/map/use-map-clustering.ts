import { useCallback, useEffect, useRef, useState } from "react"
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

export function useMapClustering(
  map: MapLibreGL.Map | null,
  architectures: ArchSummary[],
): {
  clusters: ClusterPoint[]
  getExpansionZoom: (clusterId: number, coordinates?: [number, number]) => number
} {
  const [clusters, setClusters] = useState<ClusterPoint[]>([])
  const indexRef = useRef<Supercluster<
    ArchProperties,
    ClusterProperties
  > | null>(null)

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
        properties: {
          slug: arch.slug,
          name: arch.name,
        },
      }))

    indexRef.current.load(points)
  }, [architectures])

  useEffect(() => {
    if (!map || !indexRef.current) return

    const update = () => {
      const bounds = map.getBounds()
      const zoom = Math.floor(map.getZoom())
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]

      const results = indexRef.current!.getClusters(bbox, zoom)
      const mapped: ClusterPoint[] = results.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number]
        if ("cluster" in feature.properties && feature.properties.cluster) {
          const props = feature.properties as Supercluster.ClusterProperties &
            ArchProperties
          return {
            type: "cluster",
            id: props.cluster_id,
            count: props.point_count,
            coordinates: [lng, lat],
          }
        }
        const props = feature.properties as ArchProperties
        return {
          type: "point",
          slug: props.slug,
          name: props.name,
          coordinates: [lng, lat],
        }
      })

      setClusters(mapped)
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
    (clusterId: number, _coordinates?: [number, number]) =>
      getExpansionZoom(indexRef.current, clusterId),
    [],
  )

  return { clusters, getExpansionZoom: expandZoom }
}

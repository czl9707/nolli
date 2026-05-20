import type { StyleSpecification, LayerSpecification, FilterSpecification } from "maplibre-gl"
import { MAP_COLORS } from "./map-color"

const fontFamily = "Architects Daughter"

type Stop = [number, number]
type Themed<T> = T | { dark: T; light: T }

function resolveThemed<T>(val: Themed<T>, theme: "light" | "dark"): T {
  if (typeof val === "object" && val !== null && "dark" in val) {
    return (val as { dark: T; light: T })[theme]
  }
  return val as T
}

interface RoadStages {
  show: { zoom: number; width: Themed<number> }
  split: { zoom: number; caseWidth: Themed<number>; fillWidth: Themed<number> }
  stable: { zoom: number; caseWidth: Themed<number>; fillWidth: Themed<number> }
}

interface RoadClassDef {
  id: string
  classFilter: string | string[]
  colorKeys: { line: string; case: string; fill: string }
  stages: RoadStages
  rampStages?: RoadStages
}

interface TextLabelDef {
  id: string
  sourceLayer: string
  filter: FilterSpecification
  minzoom?: number
  maxzoom?: number
  placement?: "point" | "line"
  textField?: unknown
  textSize: number | Stop[]
  textColor: string
  textTransform?: string | [number, string][]
}

const ROAD_DEFS: RoadClassDef[] = [
  {
    id: "mot",
    classFilter: "motorway",
    colorKeys: { line: "roadLineMot", case: "roadCaseMot", fill: "roadFillMot" },
    stages: {
      show: { zoom: 6, width: 0.5 },
      split: { zoom: 11, caseWidth: 3, fillWidth: 1 },
      stable: { zoom: 18, caseWidth: 22, fillWidth: 20 },
    },
    rampStages: {
      show: { zoom: 12, width: 2 },
      split: { zoom: 13, caseWidth: 3, fillWidth: 1.5 },
      stable: { zoom: 17, caseWidth: 10, fillWidth: 8 },
    },
  },
  {
    id: "trunk",
    classFilter: "trunk",
    colorKeys: { line: "roadLineTrunk", case: "roadCaseTrunk", fill: "roadFillTrunk" },
    stages: {
      show: { zoom: 6, width: 0.5 },
      split: { zoom: 11, caseWidth: 3, fillWidth: 1 },
      stable: { zoom: 18, caseWidth: 18, fillWidth: 16 },
    },
    rampStages: {
      show: { zoom: 12, width: 2 },
      split: { zoom: 13, caseWidth: 3, fillWidth: 1.5 },
      stable: { zoom: 17, caseWidth: 10, fillWidth: 8 },
    },
  },
  {
    id: "pri",
    classFilter: "primary",
    colorKeys: { line: "roadLinePri", case: "roadCasePri", fill: "roadFillPri" },
    stages: {
      show: { zoom: 6, width: 0.5 },
      split: { zoom: 11, caseWidth: 3, fillWidth: 0.3 },
      stable: { zoom: 18, caseWidth: 18, fillWidth: 16 },
    },
    rampStages: {
      show: { zoom: 12, width: 2 },
      split: { zoom: 13, caseWidth: 3, fillWidth: 1 },
      stable: { zoom: 17, caseWidth: 8, fillWidth: 8 },
    },
  },
  {
    id: "sec",
    classFilter: ["secondary", "tertiary"],
    colorKeys: { line: "roadLine", case: "roadCase", fill: "roadFill" },
    stages: {
      show: { zoom: 11, width: { dark: 0.9, light: 0.5 } },
      split: { zoom: 13, caseWidth: 3, fillWidth: 2 },
      stable: { zoom: 18, caseWidth: 16, fillWidth: 14 },
    },
  },
  {
    id: "minor",
    classFilter: "minor",
    colorKeys: { line: "roadLine", case: "roadCase", fill: "roadFill" },
    stages: {
      show: { zoom: 11, width: 0.5 },
      split: { zoom: 15, caseWidth: 3, fillWidth: 3 },
      stable: { zoom: 18, caseWidth: 14, fillWidth: 12 },
    },
  },
]

const TEXT_DEFS: TextLabelDef[] = [
  {
    id: "place_continent",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "continent"]],
    minzoom: 0,
    maxzoom: 2,
    textSize: 14,
    textTransform: "uppercase",
    textColor: "continentLabel",
  },
  {
    id: "place_country_1",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "country"], ["<=", "rank", 2]],
    minzoom: 2,
    maxzoom: 7,
    textSize: [[3, 11], [4, 12], [5, 13], [6, 14]],
    textTransform: "uppercase",
    textColor: "countryLabel",
  },
  {
    id: "place_country_2",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "country"], [">=", "rank", 3], ["has", "iso_a2"]],
    minzoom: 3,
    maxzoom: 10,
    textSize: [[3, 10], [5, 11], [6, 12], [7, 13], [8, 14]],
    textTransform: "uppercase",
    textColor: "countryLabel",
  },
  {
    id: "place_state",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "state"], ["<=", "rank", 4]],
    minzoom: 5,
    maxzoom: 10,
    textSize: [[5, 12], [7, 14]],
    textTransform: "uppercase",
    textColor: "stateLabel",
  },
  {
    id: "place_city_r5",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "city"], [">=", "rank", 0], ["<=", "rank", 5]],
    minzoom: 8,
    maxzoom: 15,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[8, 14], [10, 16], [13, 19], [14, 22]],
    textTransform: "uppercase",
    textColor: "placeLabelMajor",
  },
  {
    id: "place_city_r6",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "city"], [">=", "rank", 6]],
    minzoom: 8,
    maxzoom: 15,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[8, 12], [9, 13], [10, 14], [13, 17], [14, 20]],
    textTransform: "uppercase",
    textColor: "placeLabelMajor",
  },
  {
    id: "place_town",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "town"]],
    minzoom: 8,
    maxzoom: 14,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[8, 10], [9, 10], [10, 11], [13, 14], [14, 15]],
    textColor: "placeLabelMajor",
  },
  {
    id: "place_villages",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "village"]],
    minzoom: 10,
    maxzoom: 16,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[10, 9], [12, 10], [13, 11], [14, 12], [16, 13]],
    textColor: "placeLabelMinor",
  },
  {
    id: "place_suburbs",
    sourceLayer: "place",
    filter: ["all", ["==", "class", "suburb"]],
    minzoom: 12,
    maxzoom: 16,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[12, 9], [13, 10], [14, 11], [15, 12], [16, 13]],
    textTransform: [[8, "none"], [12, "uppercase"]],
    textColor: "placeLabelMinor",
  },
  {
    id: "place_hamlet",
    sourceLayer: "place",
    filter: ["any", ["==", "class", "neighbourhood"], ["==", "class", "hamlet"]],
    minzoom: 12,
    maxzoom: 16,
    textField: [[8, "{name_en}"], [14, "{name}"]],
    textSize: [[13, 8], [14, 10], [16, 11]],
    textTransform: [[12, "none"], [14, "uppercase"]],
    textColor: "placeLabelMinor",
  },
  {
    id: "watername_ocean",
    sourceLayer: "water_name",
    filter: ["all", ["has", "name"], ["==", "$type", "Point"], ["==", "class", "ocean"]],
    minzoom: 0,
    maxzoom: 5,
    textField: "{name}",
    textSize: [[0, 13], [2, 14], [4, 18]],
    textColor: "waterLabelColor",
  },
  {
    id: "watername_sea",
    sourceLayer: "water_name",
    filter: ["all", ["has", "name"], ["==", "$type", "Point"], ["==", "class", "sea"]],
    minzoom: 5,
    textField: "{name}",
    textSize: 12,
    textColor: "waterLabelColor",
  },
  {
    id: "watername_lake",
    sourceLayer: "water_name",
    filter: ["all", ["has", "name"], ["==", "$type", "Point"], ["==", "class", "lake"]],
    minzoom: 4,
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[13, 9], [14, 10], [15, 11], [16, 12], [17, 13]],
    textColor: "waterLabelColor",
  },
  {
    id: "watername_lake_line",
    sourceLayer: "water_name",
    filter: ["all", ["has", "name"], ["==", "$type", "LineString"]],
    placement: "line",
    textField: [[8, "{name_en}"], [13, "{name}"]],
    textSize: [[13, 9], [14, 10], [15, 11], [16, 12], [17, 13]],
    textColor: "waterLabelColor",
  },
  {
    id: "waterway_label",
    sourceLayer: "waterway",
    filter: ["all", ["has", "name"], ["==", "class", "river"]],
    placement: "line",
    textField: "{name_en}",
    textSize: [[9, 8], [10, 9]],
    textColor: "waterLabelColor",
  },
  {
    id: "roadname_minor",
    sourceLayer: "transportation_name",
    filter: ["all", ["in", "class", "minor", "service"]],
    minzoom: 16,
    placement: "line",
    textField: "{name}",
    textSize: 9,
    textColor: "roadLabel",
  },
  {
    id: "roadname_sec",
    sourceLayer: "transportation_name",
    filter: ["all", ["in", "class", "secondary", "tertiary"]],
    minzoom: 15,
    placement: "line",
    textField: "{name}",
    textSize: [[15, 9], [16, 11], [18, 12]],
    textColor: "roadLabel",
  },
  {
    id: "roadname_pri",
    sourceLayer: "transportation_name",
    filter: ["all", ["in", "class", "primary"]],
    minzoom: 14,
    placement: "line",
    textField: "{name}",
    textSize: [[14, 10], [15, 10], [16, 11], [18, 12]],
    textColor: "roadLabel",
  },
  {
    id: "roadname_major",
    sourceLayer: "transportation_name",
    filter: ["all", ["in", "class", "trunk", "motorway"]],
    minzoom: 13,
    placement: "line",
    textField: "{name}",
    textSize: [[14, 10], [15, 10], [16, 11], [18, 12]],
    textColor: "roadLabelMajor",
  },
]

function buildClassFilter(classFilter: string | string[], rampFilter?: unknown[]): unknown[] {
  const classCondition = Array.isArray(classFilter)
    ? ["in", "class", ...classFilter]
    : ["==", "class", classFilter]
  const parts: any[] = ["all", classCondition]
  if (rampFilter) parts.push(rampFilter)
  return parts
}

function generateRoadLayers(
  def: RoadClassDef,
  c: Record<string, string>,
  theme: "light" | "dark",
): LayerSpecification[] {
  const cases: LayerSpecification[] = []
  const fills: LayerSpecification[] = []

  function generateVariant(suffix: string, stages: RoadStages, rampFilter: unknown[] | undefined) {
    const showW = resolveThemed(stages.show.width, theme)
    const splitCW = resolveThemed(stages.split.caseWidth, theme)
    const splitFW = resolveThemed(stages.split.fillWidth, theme)
    const stableCW = resolveThemed(stages.stable.caseWidth, theme)
    const stableFW = resolveThemed(stages.stable.fillWidth, theme)
    const suffixStr = suffix === "noramp" ? "" : `_${suffix}`

    cases.push({
      id: `${def.id}_case${suffixStr}`,
      type: "line",
      source: "carto",
      "source-layer": "transportation",
      minzoom: stages.show.zoom,
      filter: buildClassFilter(def.classFilter, rampFilter),
      layout: { "line-cap": "square", "line-join": "round" },
      paint: {
        "line-width": {
          stops: [
            [stages.show.zoom, showW],
            [stages.split.zoom, splitCW],
            [stages.stable.zoom, stableCW],
          ],
        },
        "line-color": {
          stops: [
            [stages.show.zoom, c[def.colorKeys.line]],
            [stages.stable.zoom, c[def.colorKeys.case]],
          ],
        },
      },
    } as LayerSpecification)

    fills.push({
      id: `${def.id}_fill${suffixStr}`,
      type: "line",
      source: "carto",
      "source-layer": "transportation",
      minzoom: stages.split.zoom,
      filter: buildClassFilter(def.classFilter, rampFilter),
      layout: { "line-cap": "square", "line-join": "round" },
      paint: {
        "line-width": {
          stops: [
            [stages.split.zoom, splitFW],
            [stages.stable.zoom, stableFW],
          ],
        },
        "line-color": {
          stops: [
            [stages.split.zoom, c[def.colorKeys.line]],
            [stages.stable.zoom, c[def.colorKeys.fill]],
          ],
        },
      },
    } as LayerSpecification)
  }

  generateVariant("noramp", def.stages, undefined)
  if (def.rampStages) {
    generateVariant("ramp", def.rampStages, ["==", "ramp", 1])
  }

  return [...cases, ...fills]
}

const WATER_SOURCES = new Set(["water_name", "waterway"])

function generateTextLayers(defs: TextLabelDef[], c: Record<string, string>): LayerSpecification[] {
  return defs.map((def) => {
    const isLine = def.placement === "line"
    const isWater = WATER_SOURCES.has(def.sourceLayer)
    const haloColor = isWater ? c.waterBg : c.bg
    const textField = def.textField ?? "{name_en}"
    const textSize = Array.isArray(def.textSize) ? { stops: def.textSize } : def.textSize
    const textFieldVal = Array.isArray(textField) ? { stops: textField } : textField

    const layout: Record<string, any> = {
      "text-font": [fontFamily],
      "text-field": textFieldVal,
      "text-size": textSize,
    }

    if (def.textTransform) {
      layout["text-transform"] = Array.isArray(def.textTransform) ? { stops: def.textTransform } : def.textTransform
    }

    if (isLine) {
      layout["symbol-placement"] = "line"
      layout["symbol-avoid-edges"] = false
      layout["symbol-spacing"] = 250
      layout["text-pitch-alignment"] = "auto"
      layout["text-rotation-alignment"] = "auto"
      layout["text-justify"] = "center"
    } else {
      layout["symbol-placement"] = "point"
      layout["text-padding"] = 2
      layout["text-allow-overlap"] = false
      layout["text-ignore-placement"] = false
      layout["text-pitch-alignment"] = "auto"
      layout["text-rotation-alignment"] = "auto"
      layout["text-max-width"] = 9
      layout["text-line-height"] = 1.2
    }

    return {
      id: def.id,
      type: "symbol",
      source: "carto",
      "source-layer": def.sourceLayer,
      ...(def.minzoom !== undefined && { minzoom: def.minzoom }),
      ...(def.maxzoom !== undefined && { maxzoom: def.maxzoom }),
      filter: def.filter,
      layout,
      paint: {
        "text-color": c[def.textColor],
        "text-halo-color": haloColor,
        "text-halo-width": 2,
        "text-halo-blur": 0,
      },
    } as LayerSpecification
  })
}

export function getMapStyle(theme: "light" | "dark"): StyleSpecification {
  const t = theme
  const c = MAP_COLORS[t]

  const roadLayers = ROAD_DEFS.flatMap((def) => generateRoadLayers(def, c, t))
  const textLayers = generateTextLayers(TEXT_DEFS, c)

  return {
    version: 8 as const,
    name: t === "light" ? "Positron" : "Dark Matter",
    sources: {
      carto: {
        type: "vector",
        url: "https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json",
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        layout: { visibility: "visible" },
        paint: { "background-color": c.bg, "background-opacity": 1 },
      },
      {
        id: "landcover",
        type: "fill",
        source: "carto",
        "source-layer": "landcover",
        filter: ["any", ["==", "class", "wood"], ["==", "class", "grass"], ["==", "subclass", "recreation_ground"]],
        paint: { "fill-pattern": "grass-pattern", "fill-opacity": 1 },
      },
      {
        id: "park",
        type: "fill",
        source: "carto",
        "source-layer": "park",
        minzoom: 0,
        filter: ["any", ["==", "class", "national_park"], ["==", "class", "nature_reserve"]],
        layout: { visibility: "visible" },
        paint: {
          "fill-pattern": "forest-pattern",
          "fill-opacity": { stops: [[6, 0.7], [9, 0.9]] },
        },
      },
      {
        id: "landuse_residential",
        type: "fill",
        source: "carto",
        "source-layer": "landuse",
        minzoom: 6,
        maxzoom: 13,
        filter: ["any", ["==", "class", "residential"]],
        paint: {
          "fill-pattern": "landuse-pattern",
          "fill-opacity": { stops: [[6, 0.3], [9, 0.5]] },
        },
      },
      {
        id: "landuse",
        type: "fill",
        source: "carto",
        "source-layer": "landuse",
        filter: ["any", ["==", "class", "cemetery"], ["==", "class", "stadium"]],
        paint: { "fill-pattern": "grass-pattern" },
      },
      {
        id: "waterway",
        type: "line",
        source: "carto",
        "source-layer": "waterway",
        paint: {
          "line-color": c.waterBg,
          "line-width": { stops: [[8, .75], [9, 1.5], [15, 2], [16, 3]] },
        },
      },
      {
        id: "boundary_county",
        type: "line",
        source: "carto",
        "source-layer": "boundary",
        minzoom: 9,
        maxzoom: 24,
        filter: ["all", ["==", "admin_level", 6], ["==", "maritime", 0]],
        paint: {
          "line-color": c.boundary,
          "line-width": { stops: [[4, 0.5], [7, 1.5]] },
          "line-dasharray": { stops: [[6, [1]], [7, [2, 2]]] },
        },
      },
      {
        id: "boundary_state",
        type: "line",
        source: "carto",
        "source-layer": "boundary",
        minzoom: 4,
        filter: ["all", ["==", "admin_level", 4], ["==", "maritime", 0]],
        paint: {
          "line-color": c.boundary,
          "line-width": { stops: [[4, 0.5], [7, 1], [8, 1.2], [9, 1.5]] },
          "line-dasharray": { stops: [[6, [1]], [7, [1, 2, 3]]] },
        },
      },
      {
        id: "water",
        type: "fill",
        source: "carto",
        "source-layer": "water",
        minzoom: 0,
        maxzoom: 24,
        filter: ["all", ["==", "$type", "Polygon"]],
        layout: { visibility: "visible" },
        paint: {
          "fill-pattern": "water-pattern",
          "fill-antialias": true,
          "fill-translate-anchor": "map",
          "fill-opacity": 1,
        },
      },
      {
        id: "aeroway-runway",
        type: "line",
        source: "carto",
        "source-layer": "aeroway",
        minzoom: 12,
        filter: ["all", ["==", "class", "runway"]],
        layout: { "line-cap": "square" },
        paint: {
          "line-width": { stops: [[11, 1], [13, 4], [14, 6], [15, 8], [16, 10]] },
          "line-color": c.roadCase,
          "line-opacity": 0.1,
        },
      },
      {
        id: "aeroway-taxiway",
        type: "line",
        source: "carto",
        "source-layer": "aeroway",
        minzoom: 13,
        filter: ["all", ["==", "class", "taxiway"]],
        paint: {
          "line-color": c.roadCase,
          "line-opacity": 0.1,
          "line-width": { stops: [[13, 0.5], [14, 1], [15, 2], [16, 4]] },
        },
      },
      ...roadLayers,
      {
        id: "path",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 15,
        maxzoom: 24,
        filter: ["all", ["in", "class", "path", "track"]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": { stops: [[15, 0.5], [16, 1]] },
          "line-opacity": 0.35,
          "line-color": c.roadCase,
          "line-dasharray": { stops: [[15, [2, 2]], [18, [3, 3]]] },
        },
      },
      {
        id: "rail",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 13,
        filter: ["all", ["==", "class", "rail"]],
        layout: { visibility: "visible", "line-join": "round" },
        paint: {
          "line-color": c.roadCase,
          "line-opacity": 0.2,
          "line-width": { base: 1.3, stops: [[13, 0.5], [14, 1], [15, 1], [16, 3], [21, 7]] },
        },
      },
      {
        id: "rail_dash",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 15,
        filter: ["all", ["==", "class", "rail"]],
        layout: { visibility: "visible", "line-join": "round" },
        paint: {
          "line-color": c.roadCase,
          "line-opacity": 0.2,
          "line-width": { base: 1.3, stops: [[15, 0.5], [16, 1], [20, 5]] },
          "line-dasharray": { stops: [[15, [5, 5]], [16, [6, 6]]] },
        },
      },
      {
        id: "building",
        type: "fill",
        source: "carto",
        "source-layer": "building",
        layout: { visibility: "visible" },
        paint: {
          "fill-pattern": "building-pattern",
          // "fill-outline-color": c.buildingStroke,
          "fill-opacity": { base: 1, stops: [[13, 0.1], [16, 1]] },
        },
      },
      {
        id: "boundary_country_outline",
        type: "line",
        source: "carto",
        "source-layer": "boundary",
        minzoom: 6,
        maxzoom: 24,
        filter: ["all", ["==", "admin_level", 2], ["==", "maritime", 0]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.boundary,
          "line-opacity": 1,
          "line-width": 6,
          "line-offset": 0,
        },
      },
      {
        id: "boundary_country_inner",
        type: "line",
        source: "carto",
        "source-layer": "boundary",
        minzoom: 0,
        filter: ["all", ["==", "admin_level", 2], ["==", "maritime", 0]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.boundary,
          "line-opacity": { stops: [[3, 0.3], [6, 1]] },
          "line-width": { stops: [[3, 1.5], [6, 3]] },
          "line-offset": 0,
        },
      },
      ...textLayers,
      {
        id: "place_city_dot_r7",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 6,
        maxzoom: 7,
        filter: ["all", ["==", "class", "city"], ["<=", "rank", 7]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [fontFamily],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "icon-color": t === "light" ? c.placeLabelMajor : "rgba(94, 105, 106, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
      {
        id: "place_city_dot_r4",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 5,
        maxzoom: 7,
        filter: ["all", ["==", "class", "city"], ["<=", "rank", 4]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [fontFamily],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "icon-color": c.placeLabelMinor,
          "icon-translate-anchor": "map",
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
      {
        id: "place_city_dot_r2",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 4,
        maxzoom: 7,
        filter: ["all", ["==", "class", "city"], ["<=", "rank", 2]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [fontFamily],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "icon-color": t === "light" ? c.placeLabelMajor : "rgba(131, 164, 189, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
      {
        id: "place_city_dot_z7",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 7,
        maxzoom: 8,
        filter: ["all", ["!has", "capital"], ["!in", "class", "country", "state"]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [fontFamily],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "icon-color": t === "light" ? c.placeLabelMajor : "rgba(113, 128, 147, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
      {
        id: "place_capital_dot_z7",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 7,
        maxzoom: 8,
        filter: ["all", [">", "capital", 0]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [fontFamily],
          "text-size": 12,
          "text-transform": "uppercase",
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": c.placeLabelMajor,
          "icon-color": c.placeLabelMinor,
          "icon-translate-anchor": "map",
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
      {
        id: "poi",
        type: "symbol",
        source: "carto",
        "source-layer": "poi",
        minzoom: 15,
        filter: ["all", ["in", "class", "park", "stadium", "cemetery", "attraction"], ["<=", "rank", 3]],
        layout: {
          "text-field": "{name}",
          "text-font": [fontFamily],
          "text-size": { stops: [[15, 8], [17, 9], [18, 10]] },
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": c.poiLabel,
          "text-halo-color": c.bg,
          "text-halo-width": 2,
        },
      },
    ],
    id: "voyager",
    owner: "Carto",
  } as StyleSpecification
}

import type { StyleSpecification } from "maplibre-gl"
import { MAP_COLORS } from "./map-color"

const nearBlack = "#0e0e0e"
const steelBlue = "#697b89"
const silver = "#ddd"
const paleGreen50 = "rgba(234, 241, 233, 0.5)"
const charcoal = "#1a1a1a"
const lightGray = "#e6e6e6"
const white = "#fff"
const slateBlueGray = "rgba(65, 71, 88, 1)"
const darkGray = "#222"
const deepCharcoal = "#232323"
const offBlack = "#111"
const whiteHalo50 = "rgba(255,255,255,0.5)"
const midGray = "#666"
const deepBlack = "#0b0b0b"
const warmWhite = "#fafaf8"
const transparent = "transparent"
const creamWhite = "#f5f5f3"
const blushPink = "#ead5d7"
const nearWhite = "#fdfdfd"
const roadNameGray = "#838383"
const darkWater = "#2C353C"
const blueGray = "rgba(103, 103, 114, 1)"
const pathGray = "#d5d5d5"
const darkPath = "#262626"
const serviceDark = "#1c1c1c"
const residentialLight = "rgba(237, 237, 237, 0.25)"
const rosePink = "#e1c5c7"
const aerowayLight = "#e8e8e8"
const dustyRose = "#ebd6d8"
const countryLabel = "#8a99a4"
const countryLabelMid = "#a1adb6"
const countryLabelLight = "#b9c2c9"
const parkGreen = "#7d9c83"
const poiDarkText = "#515151"
const poiDarkHalo = "#151515"

export function getMapStyle(theme: "light" | "dark"): StyleSpecification {
  const t = theme
  const c = MAP_COLORS[t]
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
        layout: {
          visibility: "visible",
        },
        paint: {
          "background-color": c.bg,
          "background-opacity": 1,
        },
      },
      {
        id: "landcover",
        type: "fill",
        source: "carto",
        "source-layer": "landcover",
        filter: [
          "any",
          ["==", "class", "wood"],
          ["==", "class", "grass"],
          ["==", "subclass", "recreation_ground"],
        ],
        paint: {
          "fill-pattern": "forest-pattern",
          "fill-opacity": 1,
        },
      },
      {
        id: "park",
        type: "fill",
        source: "carto",
        "source-layer": "park",
        minzoom: 0,
        filter: [
          "any",
          ["==", "class", "national_park"],
          ["==", "class", "nature_reserve"],
        ],
        layout: {
          visibility: "visible",
        },
        paint: {
          "fill-pattern": "forest-pattern",
          "fill-opacity": {
            stops: [
              [6, 0.7],
              [9, 0.9],
            ],
          },
        },
      },
      // {
      //   id: "landuse_residential",
      //   type: "fill",
      //   source: "carto",
      //   "source-layer": "landuse",
      //   minzoom: 6,
      //   filter: ["any", ["==", "class", "residential"]],
      //   paint: {
      //     "fill-color": {
      //       stops:
      //         t === "light"
      //           ? [
      //               [5, "rgba(237, 237, 237, 0.5)"],
      //               [8, "rgba(237, 237, 237, 0.45)"],
      //               [9, "rgba(237, 237, 237, 0.4)"],
      //               [11, "rgba(237, 237, 237, 0.35)"],
      //               [13, "rgba(237, 237, 237, 0.3)"],
      //               [15, residentialLight],
      //               [16, residentialLight],
      //             ]
      //           : [
      //               [5, "rgba(0, 0, 0, 0.5)"],
      //               [8, "rgba(0, 0, 0, 0.45)"],
      //               [9, "rgba(0, 0, 0, 0.4)"],
      //               [11, "rgba(0, 0, 0, 0.35)"],
      //               [13, "rgba(0, 0, 0, 0.3)"],
      //               [15, "rgba(0, 0, 0, 0.25)"],
      //               [16, "rgba(0, 0, 0, 0.15)"],
      //             ],
      //     },
      //     "fill-opacity": {
      //       stops: [
      //         [6, 0.6],
      //         [9, 1],
      //       ],
      //     },
      //   },
      // },
      {
        id: "landuse",
        type: "fill",
        source: "carto",
        "source-layer": "landuse",
        filter: [
          "any",
          ["==", "class", "cemetery"],
          ["==", "class", "stadium"],
        ],
        paint: {
          "fill-color": t === "light" ? paleGreen50 : nearBlack,
        },
      },
      {
        id: "waterway",
        type: "line",
        source: "carto",
        "source-layer": "waterway",
        paint: {
          "line-color": c.waterBg,
          "line-width": {
            stops: [
              [8, 0.5],
              [9, 1],
              [15, 2],
              [16, 3],
            ],
          },
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
          "line-width": {
            stops: [
              [4, 0.5],
              [7, 1.5],
            ],
          },
          "line-dasharray": {
            stops: [
              [6, [1]],
              [7, [2, 2]],
            ],
          },
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
          "line-width": {
            stops: [
              [4, 0.5],
              [7, 1],
              [8, 1.2],
              [9, 1.5],
            ],
          },
          "line-dasharray": {
            stops: [
              [6, [1]],
              [7, [1, 2, 3]],
            ]
          },
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
        layout: {
          visibility: "visible",
        },
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
        layout: {
          "line-cap": "square",
        },
        paint: {
          "line-width": {
            stops: [
              [11, 1],
              [13, 4],
              [14, 6],
              [15, 8],
              [16, 10],
            ],
          },
          "line-color": c.roadCase,
          "line-opacity": .1,
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
          "line-opacity": .1,
          "line-width": {
            stops: [
              [13, 0.5],
              [14, 1],
              [15, 2],
              [16, 4],
            ],
          },
        },
      },
      // {
      //   id: "service_case",
      //   type: "line",
      //   source: "carto",
      //   "source-layer": "transportation",
      //   minzoom: 15,
      //   maxzoom: 24,
      //   filter: ["all", ["==", "class", "service"]],
      //   layout: {
      //     "line-cap": "round",
      //     "line-join": "round",
      //   },
      //   paint: {
      //     "line-width": {
      //       stops: [
      //         [15, 1],
      //         [16, 3],
      //         [17, 6],
      //         [18, 8],
      //       ],
      //     },
      //     "line-opacity": 1,
      //     "line-color": t === "light" ? silver : serviceDark,
      //   },
      // },
      {
        id: "minor_case",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 13,
        maxzoom: 24,
        filter: ["all", ["==", "class", "minor"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [11, 0.5],
              [12, 0.5],
              [14, 2],
              [15, 3],
              [16, 4.3],
              [17, 10],
              [18, 14],
            ],
          },
          "line-color": {
            stops: [
              [15, c.roadFill],
              [16, c.roadCase],
            ],
          },
        },
      },
      {
        id: "sec_case",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 11,
        maxzoom: 24,
        filter: ["all", ["in", "class", "secondary", "tertiary"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops:
              t === "light"
                ? [
                    [11, 0.5],
                    [12, 1.5],
                    [13, 3],
                    [14, 5],
                    [15, 6],
                    [16, 8],
                    [17, 12],
                    [18, 16],
                  ]
                : [
                    [11, 0.9],
                    [12, 1.5],
                    [13, 3],
                    [14, 5],
                    [15, 6],
                    [16, 8],
                    [17, 12],
                    [18, 16],
                  ],
          },
          "line-color": {
            stops: [
              [13, c.roadFill],
              [14, c.roadCase],
            ],
          },
        },
      },
      {
        id: "pri_case_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 7,
        maxzoom: 24,
        filter: ["all", ["==", "class", "primary"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [6, 0.5],
              [7, 0.8],
              [8, 1],
              [11, 3],
              [13, 4],
              [14, 6],
              [15, 8],
              [16, 10],
              [17, 14],
              [18, 18],
            ],
          },
          "line-color": {
            stops: [
              [7, c.roadFill],
              [12, c.roadCase],
            ],
          },
        },
      },
      {
        id: "pri_case_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "primary"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 2],
              [13, 3],
              [14, 4],
              [15, 5],
              [16, 8],
              [17, 10],
            ],
          },
          "line-color": {
            stops: [
              [5, c.roadFill],
              [7, c.roadCase],
            ],
          },
        },
      },
      {
        id: "trunk_case_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 5,
        maxzoom: 24,
        filter: ["all", ["==", "class", "trunk"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [6, 0.5],
              [7, 0.8],
              [8, 1],
              [11, 3],
              [13, 4],
              [14, 6],
              [15, 8],
              [16, 10],
              [17, 14],
              [18, 18],
            ],
          },
          "line-opacity": {
            stops: [
              [5, 0.5],
              [7, 1],
            ],
          },
          "line-color": {
            stops:
              t === "light"
                ? [
                    [5, lightGray],
                    [12, silver],
                  ]
                : [
                    [5, charcoal],
                    [12, deepCharcoal],
                  ],
          },
        },
      },
      {
        id: "trunk_case_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "trunk"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 2],
              [13, 3],
              [14, 4],
              [15, 5],
              [16, 8],
              [17, 10],
            ],
          },
          "line-opacity": 1,
          "line-color": {
            stops:
              t === "light"
                ? [
                    [12, lightGray],
                    [14, silver],
                  ]
                : [
                    [12, charcoal],
                    [14, deepCharcoal],
                  ],
          },
        },
      },
      {
        id: "mot_case_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 5,
        maxzoom: 24,
        filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [6, 0.5],
              [7, 0.7],
              [8, 0.8],
              [11, 3],
              [12, 4],
              [13, 5],
              [14, 7],
              [15, 9],
              [16, 11],
              [17, 13],
              [18, 22],
            ],
          },
          "line-opacity": {
            stops: [
              [6, 0.5],
              [7, 1],
            ],
          },
          "line-color": {
            stops:
              t === "light"
                ? [
                    [5, lightGray],
                    [12, silver],
                  ]
                : [
                    [5, charcoal],
                    [12, deepCharcoal],
                  ],
          },
        },
      },
      {
        id: "mot_case_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 2],
              [13, 3],
              [14, 4],
              [15, 5],
              [16, 8],
              [17, 10],
            ],
          },
          "line-opacity": 1,
          "line-color": {
            stops:
              t === "light"
                ? [
                    [12, lightGray],
                    [14, silver],
                  ]
                : [
                    [12, charcoal],
                    [14, deepCharcoal],
                  ],
          },
        },
      },
      {
        id: "path",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 15,
        maxzoom: 24,
        filter: ["all", ["in", "class", "path", "track"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [15, 0.5],
              [16, 1],
              [18, 3],
            ],
          },
          "line-opacity": 1,
          "line-color": t === "light" ? pathGray : darkPath,
          "line-dasharray": {
            stops: [
              [15, [2, 2]],
              [18, [3, 3]],
            ],
          },
        },
      },
      // {
      //   id: "service_fill",
      //   type: "line",
      //   source: "carto",
      //   "source-layer": "transportation",
      //   minzoom: 15,
      //   maxzoom: 24,
      //   filter: ["all", ["==", "class", "service"]],
      //   layout: {
      //     "line-cap": "round",
      //     "line-join": "round",
      //   },
      //   paint: {
      //     "line-width": {
      //       stops: [
      //         [15, 2],
      //         [16, 2],
      //         [17, 4],
      //         [18, 6],
      //       ],
      //     },
      //     "line-opacity": 1,
      //     "line-color": t === "light" ? nearWhite : deepBlack,
      //   },
      // },
      {
        id: "minor_fill",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 15,
        maxzoom: 24,
        filter: ["all", ["==", "class", "minor"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [15, 3],
              [16, 4],
              [17, 8],
              [18, 12],
            ],
          },
          "line-opacity": 1,
          "line-color": c.roadFill,
        },
      },
      {
        id: "sec_fill",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 13,
        maxzoom: 24,
        filter: ["all", ["in", "class", "secondary", "tertiary"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [11, 2],
              [13, 2],
              [14, 3],
              [15, 4],
              [16, 6],
              [17, 10],
              [18, 14],
            ],
          },
          "line-opacity": 1,
          "line-color": c.roadFill,
        },
      },
      {
        id: "pri_fill_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 10,
        maxzoom: 24,
        filter: ["all", ["==", "class", "primary"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [10, 0.3],
              [13, 2],
              [14, 4],
              [15, 6],
              [16, 8],
              [17, 12],
              [18, 16],
            ],
          },
          "line-opacity": 1,
          "line-color": c.roadFill,
        },
      },
      {
        id: "pri_fill_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "primary"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 1],
              [13, 1.5],
              [14, 2],
              [15, 3],
              [16, 6],
              [17, 8],
            ],
          },
          "line-opacity": 1,
          "line-color": c.roadFill,
        },
      },
      {
        id: "trunk_fill_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 10,
        maxzoom: 24,
        filter: ["all", ["==", "class", "trunk"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [11, 1],
              [13, 2],
              [14, 4],
              [15, 6],
              [16, 8],
              [17, 12],
              [18, 16],
            ],
          },
          "line-opacity": 1,
          "line-color": t === "light" ? white : slateBlueGray,
        },
      },
      {
        id: "trunk_fill_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "trunk"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "square",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 1],
              [13, 1.5],
              [14, 2],
              [15, 3],
              [16, 6],
              [17, 8],
            ],
          },
          "line-opacity": 1,
          "line-color": t === "light" ? white : deepBlack,
        },
      },
      {
        id: "mot_fill_noramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 10,
        maxzoom: 24,
        filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [10, 1],
              [12, 2],
              [13, 3],
              [14, 5],
              [15, 7],
              [16, 9],
              [17, 11],
              [18, 20],
            ],
          },
          "line-opacity": 1,
          "line-color": t === "light" ? white : "rgba(73, 73, 73, 1)",
        },
      },
      {
        id: "mot_fill_ramp",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 12,
        maxzoom: 24,
        filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": {
            stops: [
              [12, 1],
              [13, 1.5],
              [14, 2],
              [15, 3],
              [16, 6],
              [17, 8],
            ],
          },
          "line-opacity": 1,
          "line-color": t === "light" ? white : slateBlueGray,
        },
      },
      {
        id: "rail",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 13,
        filter: ["all", ["==", "class", "rail"]],
        layout: {
          visibility: "visible",
          "line-join": "round",
        },
        paint: {
          "line-color": t === "light" ? silver : charcoal,
          "line-width": {
            base: 1.3,
            stops: [
              [13, 0.5],
              [14, 1],
              [15, 1],
              [16, 3],
              [21, 7],
            ],
          },
        },
      },
      {
        id: "rail_dash",
        type: "line",
        source: "carto",
        "source-layer": "transportation",
        minzoom: 15,
        filter: ["all", ["==", "class", "rail"]],
        layout: {
          visibility: "visible",
          "line-join": "round",
        },
        paint: {
          "line-color": t === "light" ? white : offBlack,
          "line-width": {
            base: 1.3,
            stops: [
              [15, 0.5],
              [16, 1],
              [20, 5],
            ],
          },
          "line-dasharray": {
            stops: [
              [15, [5, 5]],
              [16, [6, 6]],
            ],
          },
        },
      },
      {
        id: "building-top",
        type: "fill",
        source: "carto",
        "source-layer": "building",
        layout: {
          visibility: "visible",
        },
        paint: {
          "fill-translate": {
            base: 1,
            stops: [
              [14, [0, 0]],
              [16, [-2, -2]],
            ],
          },
          "fill-pattern": "building-pattern",
          "fill-outline-color": c.buildingStroke,
          "fill-opacity": {
            base: 1,
            stops: [
              [13, 0],
              [16, 1],
            ],
          },
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
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
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
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": c.boundary,
          "line-opacity": {
            stops: [
              [3, 0.3],
              [6, 1],
            ],
          },
          "line-width": {
            stops: [
              [3, 1.5],
              [6, 3],
            ],
          },
          "line-offset": 0,
        },
      },
      {
        id: "waterway_label",
        type: "symbol",
        source: "carto",
        "source-layer": "waterway",
        filter: ["all", ["has", "name"], ["==", "class", "river"]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Regular Italic",
            "Open Sans Italic",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "symbol-placement": "line",
          "symbol-spacing": 300,
          "symbol-avoid-edges": false,
          "text-size": {
            stops: [
              [9, 8],
              [10, 9],
            ],
          },
          "text-padding": 2,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-offset": {
            stops: [
              [6, [0, -0.2]],
              [11, [0, -0.4]],
              [12, [0, -0.6]],
            ],
          },
          "text-letter-spacing": 0,
          "text-keep-upright": true,
        },
        paint: {
          "text-color": c.waterLabelColor,
          "text-halo-color": c.waterBg,
          "text-halo-width": 10,
          "text-halo-blur": 0,
        },
      },
      {
        id: "watername_ocean",
        type: "symbol",
        source: "carto",
        "source-layer": "water_name",
        minzoom: 0,
        maxzoom: 5,
        filter: [
          "all",
          ["has", "name"],
          ["==", "$type", "Point"],
          ["==", "class", "ocean"],
        ],
        layout: {
          "text-field": "{name}",
          "symbol-placement": "point",
          "text-size": {
            stops: [
              [0, 13],
              [2, 14],
              [4, 18],
            ],
          },
          "text-font": [
            "Montserrat Medium Italic",
            "Open Sans Italic",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-line-height": 1.2,
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-max-width": 6,
          "text-letter-spacing": 0.1,
        },
        paint: {
          "text-color": c.waterLabelColor,
          "text-halo-color": c.waterBg,
          "text-halo-width": 10,
          "text-halo-blur": 0,
        },
      },
      {
        id: "watername_sea",
        type: "symbol",
        source: "carto",
        "source-layer": "water_name",
        minzoom: 5,
        filter: [
          "all",
          ["has", "name"],
          ["==", "$type", "Point"],
          ["==", "class", "sea"],
        ],
        layout: {
          "text-field": "{name}",
          "symbol-placement": "point",
          "text-size": 12,
          "text-font": [
            "Montserrat Medium Italic",
            "Open Sans Italic",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-line-height": 1.2,
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-max-width": 6,
          "text-letter-spacing": 0.1,
        },
        paint: {
          "text-color": c.waterLabelColor,
          "text-halo-color": c.waterBg,
          "text-halo-width": 10,
          "text-halo-blur": 0,
        },
      },
      {
        id: "watername_lake",
        type: "symbol",
        source: "carto",
        "source-layer": "water_name",
        minzoom: 4,
        filter: [
          "all",
          ["has", "name"],
          ["==", "$type", "Point"],
          ["==", "class", "lake"],
        ],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "symbol-placement": "point",
          "text-size": {
            stops: [
              [13, 9],
              [14, 10],
              [15, 11],
              [16, 12],
              [17, 13],
            ],
          },
          "text-font": [
            "Montserrat Regular Italic",
            "Open Sans Italic",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-line-height": 1.2,
          "text-padding": 2,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
        },
        paint: {
          "text-color": c.waterLabelColor,
          "text-halo-color": c.waterBg,
          "text-halo-width": 10,
          "text-halo-blur": 0,
        },
      },
      {
        id: "watername_lake_line",
        type: "symbol",
        source: "carto",
        "source-layer": "water_name",
        filter: ["all", ["has", "name"], ["==", "$type", "LineString"]],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "symbol-placement": "line",
          "text-size": {
            stops: [
              [13, 9],
              [14, 10],
              [15, 11],
              [16, 12],
              [17, 13],
            ],
          },
          "text-font": [
            "Montserrat Regular Italic",
            "Open Sans Italic",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "symbol-spacing": 350,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-line-height": 1.2,
        },
        paint: {
          "text-color": c.waterLabelColor,
          "text-halo-color": c.waterBg,
          "text-halo-width": 10,
          "text-halo-blur": 0,
        },
      },
      {
        id: "place_hamlet",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 12,
        maxzoom: 16,
        filter: [
          "any",
          ["==", "class", "neighbourhood"],
          ["==", "class", "hamlet"],
        ],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [14, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [13, 8],
              [14, 10],
              [16, 11],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": {
            stops: [
              [12, "none"],
              [14, "uppercase"],
            ],
          },
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(182, 180, 180, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color":
            t === "light" ? whiteHalo50 : "rgba(53, 52, 52, 1)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_suburbs",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 12,
        maxzoom: 16,
        filter: ["all", ["==", "class", "suburb"]],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [12, 9],
              [13, 10],
              [14, 11],
              [15, 12],
              [16, 13],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": {
            stops: [
              [8, "none"],
              [12, "uppercase"],
            ],
          },
        },
        paint: {
          "text-color": t === "light" ? steelBlue : midGray,
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_villages",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 10,
        maxzoom: 16,
        filter: ["all", ["==", "class", "village"]],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [10, 9],
              [12, 10],
              [13, 11],
              [14, 12],
              [16, 13],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": "none",
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(154, 153, 153, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_town",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 8,
        maxzoom: 14,
        filter: ["all", ["==", "class", "town"]],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [8, 10],
              [9, 10],
              [10, 11],
              [13, 14],
              [14, 15],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": "none",
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(204, 208, 228, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_country_2",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 3,
        maxzoom: 10,
        filter: [
          "all",
          ["==", "class", "country"],
          [">=", "rank", 3],
          ["has", "iso_a2"],
        ],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [3, 10],
              [5, 11],
              [6, 12],
              [7, 13],
              [8, 14],
            ],
          },
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": {
            stops:
              t === "light"
                ? [
                    [3, countryLabel],
                    [5, countryLabelMid],
                    [6, countryLabelLight],
                  ]
                : [
                    [3, "rgba(157, 157, 157, 1)"],
                    [5, "rgba(114, 114, 114, 1)"],
                    [6, "rgba(112, 112, 112, 1)"],
                  ],
          },
          "text-halo-color": t === "light" ? warmWhite : offBlack,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_country_1",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 2,
        maxzoom: 7,
        filter: ["all", ["==", "class", "country"], ["<=", "rank", 2]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [3, 11],
              [4, 12],
              [5, 13],
              [6, 14],
            ],
          },
          "text-transform": "uppercase",
          "text-max-width": {
            stops: [
              [2, 6],
              [3, 6],
              [4, 9],
              [5, 12],
            ],
          },
        },
        paint: {
          "text-color": {
            stops:
              t === "light"
                ? [
                    [3, countryLabel],
                    [5, countryLabelMid],
                    [6, countryLabelLight],
                  ]
                : [
                    [3, "rgba(158, 182, 189, 1)"],
                    [5, "rgba(118, 126, 137, 1)"],
                    [6, "rgba(120, 141, 147, 1)"],
                  ],
          },
          "text-halo-color": t === "light" ? warmWhite : offBlack,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_state",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 5,
        maxzoom: 10,
        filter: ["all", ["==", "class", "state"], ["<=", "rank", 4]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [5, 12],
              [7, 14],
            ],
          },
          "text-transform": "uppercase",
          "text-max-width": 9,
        },
        paint: {
          "text-color": t === "light" ? "#97a4ae" : "rgba(203, 230, 230, 1)",
          "text-halo-color": t === "light" ? warmWhite : offBlack,
          "text-halo-width": 0,
        },
      },
      {
        id: "place_continent",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 0,
        maxzoom: 2,
        filter: ["all", ["==", "class", "continent"]],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-transform": "uppercase",
          "text-size": 14,
          "text-letter-spacing": 0.1,
          "text-max-width": 9,
          "text-justify": "center",
          "text-keep-upright": false,
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(135, 164, 179, 1)",
          "text-halo-color": t === "light" ? warmWhite : offBlack,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_city_r6",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 8,
        maxzoom: 15,
        filter: ["all", ["==", "class", "city"], [">=", "rank", 6]],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [8, 12],
              [9, 13],
              [10, 14],
              [13, 17],
              [14, 20],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(168, 176, 180, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_city_r5",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 8,
        maxzoom: 15,
        filter: [
          "all",
          ["==", "class", "city"],
          [">=", "rank", 0],
          ["<=", "rank", 5],
        ],
        layout: {
          "text-field": {
            stops: [
              [8, "{name_en}"],
              [13, "{name}"],
            ],
          },
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [8, 14],
              [10, 16],
              [13, 19],
              [14, 22],
            ],
          },
          "icon-image": "",
          "icon-offset": [16, 0],
          "text-anchor": "center",
          "icon-size": 1,
          "text-max-width": 10,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(211, 228, 236, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
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
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(174, 191, 207, 1)",
          "icon-color": t === "light" ? steelBlue : "rgba(94, 105, 106, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
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
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(233, 239, 246, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
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
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(175, 194, 217, 1)",
          "icon-color": t === "light" ? steelBlue : "rgba(131, 164, 189, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "place_city_dot_z7",
        type: "symbol",
        source: "carto",
        "source-layer": "place",
        minzoom: 7,
        maxzoom: 8,
        filter: [
          "all",
          ["!has", "capital"],
          ["!in", "class", "country", "state"],
        ],
        layout: {
          "text-field": "{name_en}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(160, 179, 191, 1)",
          "icon-color": t === "light" ? steelBlue : "rgba(113, 128, 147, 1)",
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
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
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 12,
          "icon-offset": [16, 5],
          "text-anchor": "right",
          "icon-size": 0.4,
          "text-max-width": 8,
          "text-keep-upright": true,
          "text-offset": [0.2, 0.2],
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": t === "light" ? steelBlue : "rgba(177, 201, 214, 1)",
          "icon-color": t === "light" ? steelBlue : midGray,
          "icon-translate-anchor": "map",
          "text-halo-color": t === "light" ? whiteHalo50 : darkGray,
          "text-halo-width": 1,
        },
      },
      {
        id: "poi",
        type: "symbol",
        source: "carto",
        "source-layer": "poi",
        minzoom: 15,
        filter: [
          "all",
          ["in", "class", "park", "stadium", "cemetery", "attraction"],
          ["<=", "rank", 3],
        ],
        layout: {
          "text-field": "{name}",
          "text-font": [
            "Montserrat Medium",
            "Open Sans Bold",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [15, 8],
              [17, 9],
              [18, 10],
            ],
          },
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": t === "light" ? parkGreen : poiDarkText,
          "text-halo-color": t === "light" ? creamWhite : poiDarkHalo,
          "text-halo-width": 1,
        },
      },
      {
        id: "roadname_minor",
        type: "symbol",
        source: "carto",
        "source-layer": "transportation_name",
        minzoom: 16,
        filter: ["all", ["in", "class", "minor", "service"]],
        layout: {
          "symbol-placement": "line",
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": 9,
          "text-field": "{name}",
          "symbol-avoid-edges": false,
          "symbol-spacing": 200,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-justify": "center",
        },
        paint: {
          "text-color": t === "light" ? roadNameGray : "rgba(181, 180, 180, 1)",
          "text-halo-color": t === "light" ? white : offBlack,
          "text-halo-width": 1,
        },
      },
      {
        id: "roadname_sec",
        type: "symbol",
        source: "carto",
        "source-layer": "transportation_name",
        minzoom: 15,
        filter: ["all", ["in", "class", "secondary", "tertiary"]],
        layout: {
          "symbol-placement": "line",
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [15, 9],
              [16, 11],
              [18, 12],
            ],
          },
          "text-field": "{name}",
          "symbol-avoid-edges": false,
          "symbol-spacing": 200,
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-justify": "center",
        },
        paint: {
          "text-color": t === "light" ? roadNameGray : "rgba(146, 146, 146, 1)",
          "text-halo-color": t === "light" ? white : "rgba(34, 34, 34, 1)",
          "text-halo-width": 1,
        },
      },
      {
        id: "roadname_pri",
        type: "symbol",
        source: "carto",
        "source-layer": "transportation_name",
        minzoom: 14,
        filter: ["all", ["in", "class", "primary"]],
        layout: {
          "symbol-placement": "line",
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [14, 10],
              [15, 10],
              [16, 11],
              [18, 12],
            ],
          },
          "text-field": "{name}",
          "symbol-avoid-edges": false,
          "symbol-spacing": {
            stops: [
              [6, 200],
              [16, 250],
            ],
          },
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-justify": "center",
          "text-letter-spacing": {
            stops: [
              [14, 0],
              [16, 0.2],
            ],
          },
        },
        paint: {
          "text-color": t === "light" ? roadNameGray : "rgba(189, 189, 189, 1)",
          "text-halo-color": t === "light" ? white : offBlack,
          "text-halo-width": 1,
        },
      },
      {
        id: "roadname_major",
        type: "symbol",
        source: "carto",
        "source-layer": "transportation_name",
        minzoom: 13,
        filter: ["all", ["in", "class", "trunk", "motorway"]],
        layout: {
          "symbol-placement": "line",
          "text-font": [
            "Montserrat Regular",
            "Open Sans Regular",
            "Noto Sans Regular",
            "HanWangHeiLight Regular",
            "NanumBarunGothic Regular",
          ],
          "text-size": {
            stops: [
              [14, 10],
              [15, 10],
              [16, 11],
              [18, 12],
            ],
          },
          "text-field": "{name}",
          "symbol-avoid-edges": false,
          "symbol-spacing": {
            stops: [
              [6, 200],
              [16, 250],
            ],
          },
          "text-pitch-alignment": "auto",
          "text-rotation-alignment": "auto",
          "text-justify": "center",
          "text-letter-spacing": {
            stops: [
              [13, 0],
              [16, 0.2],
            ],
          },
        },
        paint: {
          "text-color": t === "light" ? roadNameGray : "#383838",
          "text-halo-color": t === "light" ? white : offBlack,
          "text-halo-width": 1,
        },
      },
    ],
    id: "voyager",
    owner: "Carto",
  } as StyleSpecification
}

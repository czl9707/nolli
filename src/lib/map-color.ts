const DARK_MAP_COLORS = {
    bg: '#000',
    boundary: '#666',
    roadCase: "#888",
    roadFill: '#333',
    waterBg: 'rgb(21, 30, 36)',
    waterStroke: '#000',
    waterLabelColor: '#bbb',
    landcoverBg: '#000',
    landcoverStroke: '#fff',
    buildingBg: '#111',
    buildingStroke: '#666',
} as const;

const LIGHT_MAP_COLORS = {
    bg: '#fff',
    boundary: '#999',
    roadCase: "#888",
    roadFill: '#ddd',
    waterBg: '#ddd', // fix light blue water color
    waterStroke: '#fff',
    waterLabelColor: '#444',
    landcoverBg: '#fff',
    landcoverStroke: '#000',
    buildingBg: '#eee',
    buildingStroke: '#aaa',
} as const;

export const MAP_COLORS = {
    light: LIGHT_MAP_COLORS,
    dark: DARK_MAP_COLORS,
} as const;
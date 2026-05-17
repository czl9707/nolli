const DARK_MAP_COLORS = {
    waterBg: '#000',
    waterStroke: '#fff',
    waterLabelColor: '#bbb',
    landcoverBg: '#000',
    landcoverStroke: '#fff',
} as const;

const LIGHT_MAP_COLORS = {
    waterBg: '#fff',
    waterStroke: '#000',
    waterLabelColor: '#444',
    landcoverBg: '#fff',
    landcoverStroke: '#000',
} as const;

export const MAP_COLORS = {
    light: LIGHT_MAP_COLORS,
    dark: DARK_MAP_COLORS,
} as const;
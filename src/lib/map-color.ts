const DARK_MAP_COLORS = {
    bg: '#080808',
    boundary: '#666',
    roadLine: '#222',
    roadCase: "#666",
    roadFill: '#000',

    roadLinePri: '#222',
    roadCasePri: '#555',
    roadFillPri: '#000',
    roadLineMot: '#222',
    roadCaseMot: '#444',
    roadFillMot: '#3F3F3F',
    roadLineTrunk: '#222',
    roadCaseTrunk: '#444',
    roadFillTrunk: '#3F3F3F',

    waterBg: 'rgb(21, 30, 36)',
    waterStroke: '#000',
    waterLabelColor: '#bbb',
    landcoverStroke: '#fff',
    buildingBg: '#080808',
    buildingStroke: '#444',
    landuseBg: '#0A0A0A',
    landuseStroke: '#666',
} as const;

const LIGHT_MAP_COLORS = {
    bg: '#fafaf8',
    boundary: '#999',    
    roadLine: '#ddd',
    roadCase: "#888",
    roadFill: '#ddd',

    roadLinePri: '#ddd',
    roadCasePri: '#888',
    roadFillPri: '#ddd',
    roadLineTrunk: '#d8d8d8',
    roadCaseTrunk: '#999',
    roadFillTrunk: '#c8c8c8',
    roadLineMot: '#d8d8d8',
    roadCaseMot: '#999',
    roadFillMot: '#c8c8c8',
    
    waterBg: 'rgb(212, 218, 220)', 
    waterStroke: '#fafaf8',
    waterLabelColor: '#444',
    landcoverStroke: '#000',
    buildingBg: '#eee',
    buildingStroke: '#aaa',
    landuseBg: '#fafaf8',
    landuseStroke: '#aaa',
} as const;

export const MAP_COLORS = {
    light: LIGHT_MAP_COLORS,
    dark: DARK_MAP_COLORS,
} as const;
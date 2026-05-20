const DARK_MAP_COLORS = {
    bg: '#1E1E1E',
    boundary: '#9F9C91',
    roadLine: '#333231',
    roadCase: "#F6F0DE",
    roadFill: '#484744',

    roadLinePri: '#333231',
    roadCasePri: '#F6F0DE',
    roadFillPri: '#89867D',
    roadLineMot: '#282827',
    roadCaseMot: '#CBC6B7',
    roadFillMot: '#74716A',
    roadLineTrunk: '#282827',
    roadCaseTrunk: '#CBC6B7',
    roadFillTrunk: '#74716A',

    waterBg: '#F6F0DE',
    waterStroke: '#1E1E1E',
    landcoverStroke: '#F6F0DE',
    buildingBg: '#1E1E1E',
    buildingStroke: '#F6F0DE',
    landuseStroke: '#666',
    
    waterLabelColor: '#1E1E1E',
    priLabel: '#F6F0DE',
    secLabel: '#F6F0DE',
    minorLabel: '#F6F0DE',
    waterLabelHalo: '#B5B1A4',
    labelHalo: "#484744"
} as const;

const LIGHT_MAP_COLORS = {
    bg: '#F6F0DE',
    boundary: '#74716A',
    roadLine: '#E0DACA',
    roadCase: '#1E1E1E',
    roadFill: '#CBC6B7',

    roadLinePri: '#E0DACA',
    roadCasePri: '#1E1E1E',
    roadFillPri: '#89867D',
    roadLineMot: '#ECE6D5',
    roadCaseMot: '#484744',
    roadFillMot: '#9F9C91',
    roadLineTrunk: '#ECE6D5',
    roadCaseTrunk: '#484744',
    roadFillTrunk: '#9F9C91',

    waterBg: '#1E1E1E',
    waterStroke: '#F6F0DE',
    landcoverStroke: '#1E1E1E',
    buildingBg: '#F6F0DE',
    buildingStroke: '#1E1E1E',
    landuseStroke: '#666',

    waterLabelColor: '#F6F0DE',
    priLabel: '#1E1E1E',
    secLabel: '#1E1E1E',
    minorLabel: '#1E1E1E',
    waterLabelHalo: '#5F5D58',
    labelHalo: '#CBC6B7',
} as const;

export const MAP_COLORS = {
    light: LIGHT_MAP_COLORS,
    dark: DARK_MAP_COLORS,
} as const;

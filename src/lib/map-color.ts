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
    landcoverStroke: '#000',
    buildingBg: '#eee',
    buildingStroke: '#aaa',
    landuseBg: '#fafaf8',
    landuseStroke: '#aaa',
    
    waterLabelColor: '#444',
    placeLabelMajor: '#697b89',
    placeLabelMinor: '#697b89',
    countryLabel: '#8a99a4',
    stateLabel: '#97a4ae',
    continentLabel: '#697b89',
    poiLabel: '#7d9c83',
    roadLabel: '#838383',
    roadLabelMajor: '#838383',
} as const;

export const MAP_COLORS = {
    light: LIGHT_MAP_COLORS,
    dark: DARK_MAP_COLORS,
} as const;

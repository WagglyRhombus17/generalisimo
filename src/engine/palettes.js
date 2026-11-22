// Colour palettes. VGA is the main "Sendero VGA" look; TACT is the staff-map look.

export const VGA = {
  sky: ['#26163f', '#4a2259', '#7f2d5e', '#c24d55', '#ec8a4e', '#f7c36a'],
  sun: '#fff1b8', glow: '#f9d27a', cloud: '#d96a5a',
  hillFar: '#5b3358', hillFarL: '#74405f', hillMid: '#7c5040', hillMidL: '#9a6a48',
  ground: ['#b88a46', '#9c7238', '#7d5a2c'],
  road: '#8a6a48', roadD: '#6a4e36', rut: '#5a4230',
  trunk: '#4a3020', tree: '#4f6a2a', treeD: '#34481c', treeL: '#7d9640', pole: '#3a2618',
  stone: ['#e2c99a', '#b8996a'], white: '#efe4cc', roof: '#a8452c', slate: '#3e3a52', gold: '#f7c36a',
  smoke: ['#4a3f50', '#6a5e6e'], outline: '#1a1016',
  olive: '#6b7a34', oliveD: '#4a5624', canvas: '#8a8a52', canvasL: '#a8a868', canvasD: '#6a6a3e',
  glass: '#9fc4d8', hub: '#8a8a8a', skin: '#d9a27a', cap: '#3e4a1c', dust: '#d8b480',
  sea: ['#3f7cb0', '#2f5d98', '#24427e', '#1a2b5e'], foam: '#d6ecff',
  rock: '#7a6a72', rockL: '#a08a86', rockD: '#4e4250',
  ship: '#4b505e', shipL: '#8b93a3', shipD: '#2a2d36', funnel: '#c8b070',
  plane: '#9aa0a8', planeD: '#5e646c', planeL: '#c8ccd2',
  nsky: ['#05060f', '#0b1230', '#162350', '#28396e'], star: '#fff6d0', moon: '#f3e6b6', moonD: '#c9b98a',
  nground: ['#191812', '#26241a'], light: '#ffd36a', silh: '#0a0a0c', silhL: '#3a3f52'
};

const SKIES = {
  sunset: {},
  day: {
    sky: ['#2f5fae', '#4a7cc4', '#76a0d4', '#a8c4e0', '#d8dccc', '#ecdcb4'],
    sun: '#fff8e0', glow: '#fff0c0', cloud: '#ffffff',
    hillFar: '#8a86a8', hillFarL: '#a4a0c0', hillMid: '#9a7656', hillMidL: '#b8946a',
    ground: ['#c89a52', '#ac7e40', '#8a6430']
  },
  dawn: {
    sky: ['#2a2a5a', '#4a3f72', '#7a5a80', '#c0787a', '#eca882', '#f7d0a0'],
    sun: '#fff0d0', glow: '#f7c896', cloud: '#e89a8a', hillFar: '#5a4a6e', hillFarL: '#76608a'
  },
  // Overcast and green: the Basque Country, Cantabria and Asturias.
  north: {
    sky: ['#3e4858', '#4e5a6c', '#626e80', '#7a8694', '#949ea8', '#aab2b8'],
    sun: '#dfe4e6', glow: '#c4ccd0', cloud: '#c8d0d6',
    hillFar: '#465e52', hillFarL: '#56705e', hillMid: '#3e5e34', hillMidL: '#527444',
    ground: ['#5e8040', '#4e6c34', '#3e5828'], road: '#6e6252', roadD: '#52483c', rut: '#463e32',
    tree: '#3e5a26', treeD: '#2a401a', treeL: '#5e7a3a', dust: '#8a8a70'
  },
  // Snow on the ground: Teruel, the winter of 1937-38.
  winter: {
    sky: ['#4e5464', '#626878', '#7a8090', '#9298a6', '#acb0bc', '#c6c8d0'],
    sun: '#f2f2ee', glow: '#d6d8d8', cloud: '#e2e4ea',
    hillFar: '#8e96a6', hillFarL: '#c2c8d2', hillMid: '#a8aebc', hillMidL: '#d8dde6',
    ground: ['#e2e6ec', '#c8ced8', '#a8b0be'], road: '#8a8a94', roadD: '#6a6a76', rut: '#5a5a66',
    tree: '#3a4a3a', treeD: '#26342a', treeL: '#5a6a5a', dust: '#e6eaf0', roof: '#7a5a50'
  }
};

export const palFor = sky => Object.assign({}, VGA, SKIES[sky] || {});

// Staff-map palette (map screen, generals, council, airlift).
export const TACT = Object.assign({}, VGA, {
  ocean: ['#0e2236', '#102840'], oceanL: '#1d4466', oceanS: '#0a1828', grid: '#16344f',
  rep: '#3d64a0', repD: '#2f5088', nat: '#a84438', natD: '#8a362c', neutral: '#5e6658', neutralD: '#4c5448',
  coast: '#e8dcb0', front: '#ffd84a', border: '#8a8a70', city: '#0b1018', cityL: '#ffe9a8',
  arrow: '#ffd84a', arrowO: '#0b1018', unitN: '#c85040', unitR: '#4a78c0', unitMark: '#f4ecd0',
  pbg: ['#2a3a4a', '#101820'], uni: '#6b7a34', uniL: '#8d9a4c', uniD: '#4a5624', tab: '#e0b850',
  medal: '#e0b850', medal2: '#b03030', skinD: '#b07a58', hair: '#2a1a14', beard: '#e8e2d6',
  capC: '#4a5624', capL: '#6b7a34', capBand: '#e0b850', badge: '#ffe08a', glassC: '#cfe6f2'
});

export const HOLD = Object.assign({}, VGA, {
  hang: ['#0d1014', '#181d24', '#232a33'], floor: '#2a2620', floorL: '#3a342a',
  plane: '#8f969e', planeD: '#5c626a', planeL: '#b9bfc6', interior: '#1c2026', cell: '#3a4450',
  crate: '#9a6a36', crateD: '#6a4622', metal: '#7c848c', mule: '#8a6034', muleD: '#5e4022',
  outline: '#0b0d10', prop: '#c0c6cc', pick: '#ffc857'
});

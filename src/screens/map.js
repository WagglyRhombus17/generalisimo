// The campaign map (direction C): territory by date, your route, units and cities.
import { FB, dith, hash } from '../engine/pixel.js';
import { TACT } from '../engine/palettes.js';
import { fmtDate } from '../game/state.js';
import { sfx } from '../audio/audio.js';

// Coastlines and fronts in a 400x320 "base" space, projected onto the screen.
const IBERIA = [[48, 46], [62, 40], [90, 38], [120, 36], [160, 38], [200, 36], [232, 40], [262, 40], [300, 52], [340, 62], [346, 72], [338, 90], [320, 104], [306, 122], [300, 140], [296, 160], [308, 176], [318, 184], [300, 196], [290, 212], [282, 230], [264, 244], [246, 252], [228, 256], [200, 262], [178, 264], [160, 268], [140, 272], [132, 276], [120, 262], [108, 252], [94, 240], [72, 240], [60, 236], [52, 222], [56, 200], [46, 186], [48, 180], [50, 160], [44, 140], [42, 112], [44, 88], [40, 66], [44, 52]];
const PORTUGAL = [[20, 80], [78, 80], [84, 110], [80, 150], [88, 186], [84, 222], [74, 238], [20, 240]];
const FRANCE = [[250, 0], [400, 0], [400, 58], [342, 60], [300, 50], [262, 38], [254, 20]];
const AFRICA = [[20, 320], [20, 292], [70, 292], [96, 284], [120, 282], [140, 281], [156, 286], [190, 290], [230, 292], [300, 296], [400, 290], [400, 320]];
// Nationalist territory: late July, mid August, late September 1936.
const NAT_NORTH = [[20, 20], [110, 20], [112, 60], [200, 62], [250, 60], [258, 46], [278, 48], [288, 80], [284, 100], [262, 115], [230, 112], [205, 108], [180, 112], [150, 124], [120, 130], [20, 130]];
const NAT_SOUTH = [[96, 244], [118, 234], [140, 226], [160, 232], [168, 250], [150, 262], [150, 280], [120, 280], [100, 262]];
const NAT_CORRIDOR = [[84, 128], [130, 130], [124, 170], [150, 205], [160, 232], [118, 236], [96, 236], [86, 200], [84, 160]];
const NAT_SEPT = [[20, 20], [110, 20], [112, 60], [200, 62], [250, 60], [258, 46], [278, 48], [288, 80], [284, 100], [262, 115], [230, 118], [212, 118], [200, 122], [188, 136], [178, 150], [168, 165], [150, 188], [150, 205], [186, 214], [184, 236], [170, 256], [150, 262], [150, 280], [120, 280], [100, 262], [20, 262]];
const PHASES = [[NAT_NORTH, NAT_SOUTH], [NAT_NORTH, NAT_SOUTH, NAT_CORRIDOR], [NAT_SEPT]];
const MOUNTAINS = [[300, 54, 40, 8], [150, 50, 52, 6], [168, 114, 40, 6], [226, 246, 26, 5], [168, 206, 34, 5], [252, 110, 10, 28]];

export const CITIES = [
  { n: 'MADRID', p: [198, 128], cap: 1, c: 'cap1 r' }, { n: 'Toledo', p: [190, 152], c: 'r' }, { n: 'Talavera', p: [162, 146], c: 'b' },
  { n: 'Sevilla', p: [152, 238], c: 'l' }, { n: 'Mérida', p: [106, 190], c: 'r' }, { n: 'Badajoz', p: [92, 184], c: 'l' },
  { n: 'Burgos', p: [222, 70], c: '' }, { n: 'Salamanca', p: [136, 116], c: '' }, { n: 'Zaragoza', p: [270, 92], c: '' },
  { n: 'Barcelona', p: [328, 88], c: 'b' }, { n: 'Valencia', p: [292, 168], c: 'l' }, { n: 'Málaga', p: [184, 258], c: 'b' },
  { n: 'Ceuta', p: [142, 286], c: 'r' }, { n: 'Tetuán', p: [130, 296], c: 'l' }, { n: 'Lisboa', p: [56, 178], c: 'r' }
];

function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
const inE = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// 0 sea, 1 Republic, 2 Nationalist, 3 neutral land
function classify(x, y, phase) {
  if (inPoly(x, y, FRANCE)) return 3;
  if (inPoly(x, y, IBERIA)) {
    if (inPoly(x, y, PORTUGAL)) return 3;
    return PHASES[phase].some(p => inPoly(x, y, p)) ? 2 : 1;
  }
  if (inPoly(x, y, AFRICA)) return (x > 96 && x < 232) ? 2 : 3;
  if (inE(x, y, 380, 150, 10, 6) || inE(x, y, 352, 172, 4, 3)) return 2;
  if (inE(x, y, 398, 138, 5, 3)) return 1;
  return 0;
}

function makeProj(b) {
  const rx0 = 24, ry0 = 18, rw = 378, rh = 294, s = Math.min(b.w / rw, b.h / rh);
  const ox = b.x + (b.w - rw * s) / 2, oy = b.y + (b.h - rh * s) / 2;
  return { fwd: (x, y) => [ox + (x - rx0) * s, oy + (y - ry0) * s], inv: (x, y) => [(x - ox) / s + rx0, (y - oy) / s + ry0] };
}

function arrow(fb, pts, col, out, dash) {
  const seg = (t, c) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let k = 0; k <= n; k++) {
        if (dash && ((k >> 2) & 1)) continue;
        fb.rect(Math.round(x0 + (x1 - x0) * k / n - t / 2), Math.round(y0 + (y1 - y0) * k / n - t / 2), t, t, c);
      }
    }
  };
  seg(4, out); seg(2, col);
  const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1];
  const L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, px = -uy, py = ux;
  const head = (sz, c) => {
    const tx = bx + ux * sz, ty = by + uy * sz, cx = bx - ux * sz * 0.4, cy = by - uy * sz * 0.4;
    for (let s = 0; s <= 1; s += 0.04) {
      const qx = cx + px * sz * (s * 2 - 1), qy = cy + py * sz * (s * 2 - 1), n = Math.ceil(Math.hypot(tx - qx, ty - qy));
      for (let k = 0; k <= n; k++) fb.set(qx + (tx - qx) * k / n, qy + (ty - qy) * k / n, c);
    }
  };
  head(5, out); head(3, col);
}

function counter(fb, x, y, c, m, o) {
  x = Math.round(x) - 4; y = Math.round(y) - 3;
  fb.rect(x - 1, y - 1, 11, 9, o); fb.rect(x, y, 9, 7, c);
  fb.line(x + 1, y + 1, x + 7, y + 5, m); fb.line(x + 7, y + 1, x + 1, y + 5, m);
}

export function renderMap(W, H, P, box, o = {}) {
  const fb = new FB(W, H), pr = makeProj(box), cl = new Uint8Array(W * H), phase = o.phase ?? 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [bx, by] = pr.inv(x + 0.5, y + 0.5); cl[y * W + x] = classify(bx, by, phase); }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : cl[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = cl[y * W + x];
    if (c === 0) {
      let col = dith(x, y, 0.5) ? P.ocean[1] : P.ocean[0];
      if (y % 7 === 0 && hash(x >> 2, y, 1) < 0.3) col = P.oceanL;
      if (o.grid && (x % o.grid === 0 || y % o.grid === 0)) col = P.grid;
      if (at(x - 1, y - 1) || at(x - 2, y - 2)) col = P.oceanS;
      fb.set(x, y, col);
    } else {
      const base = c === 1 ? P.rep : c === 2 ? P.nat : P.neutral, dk = c === 1 ? P.repD : c === 2 ? P.natD : P.neutralD;
      fb.set(x, y, hash(x, y, 5) < 0.07 ? dk : base);
    }
  }
  for (let y = 0; y < H; y += 4) for (let x = ((y >> 2) & 1) * 3; x < W; x += 6) {
    const c = at(x, y); if (!c) continue;
    const [bx, by] = pr.inv(x, y);
    if (!MOUNTAINS.some(m => inE(bx, by, m[0], m[1], m[2], m[3]))) continue;
    const dk = c === 1 ? P.repD : c === 2 ? P.natD : P.neutralD;
    fb.set(x, y, dk); fb.set(x - 1, y + 1, dk); fb.set(x + 1, y + 1, dk);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = at(x, y);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const b = at(x + dx, y + dy);
      if (a === b) continue;
      if (a === 0 || b === 0) { if (a) fb.set(x, y, P.coast); else fb.set(x + dx, y + dy, P.coast); }
      else if ((a === 1 && b === 2) || (a === 2 && b === 1)) { fb.set(x, y, P.front); fb.set(x + dx, y + dy, P.front); }
      else if ((x + y) & 1) fb.set(x, y, P.border);
    }
  }
  (o.arrows || []).forEach(a => arrow(fb, a.pts.map(p => pr.fwd(p[0], p[1])), P.arrow, P.arrowO, a.dash));
  (o.cities || []).forEach(c => {
    const [x, y] = pr.fwd(c.p[0], c.p[1]).map(Math.round);
    if (c.cap) { fb.rect(x - 3, y - 3, 7, 7, P.city); fb.rect(x - 2, y - 2, 5, 5, P.cityL); fb.set(x, y, P.city); }
    else { fb.rect(x - 2, y - 2, 5, 5, P.city); fb.rect(x - 1, y - 1, 3, 3, P.cityL); }
  });
  (o.units || []).forEach(u => { const [x, y] = pr.fwd(u.p[0], u.p[1]); counter(fb, x, y, u.r ? P.unitR : u.you ? '#ffc857' : P.unitN, u.you ? '#101820' : P.unitMark, P.arrowO); });
  return { fb, fwd: pr.fwd };
}

export function placeLabels(el, fwd, W, H, items) {
  items.forEach(it => {
    if (!it.n) return;
    const [x, y] = fwd(it.p[0], it.p[1]);
    const s = document.createElement('span');
    s.className = 'lbl ' + (it.c || '');
    s.textContent = it.n;
    s.style.left = (x / W * 100) + '%';
    s.style.top = (y / H * 100) + '%';
    el.appendChild(s);
  });
}

export const mapPhase = day => (day < 25 ? 0 : day < 45 ? 1 : 2);

export function openMap(S, D) {
  const ov = document.getElementById('ov-map');
  ov.hidden = false;
  sfx('paper');
  ov.innerHTML = `<div class="mapwrap"><canvas></canvas></div>
    <div class="topbar"><span class="date"></span><span class="tb-t">CAMPAIGN MAP</span></div>
    <div class="pnl side"><h3>THE ROUTE</h3><ol class="stops"></ol>
      <div class="legend"><span><i style="background:#a84438"></i>Nationalist</span><span><i style="background:#3d64a0"></i>Republic</span><span><i style="background:#5e6658"></i>Neutral</span><span><i style="background:#ffd84a"></i>Front line</span><span><i style="background:#ffc857"></i>Your column</span></div>
      <p class="mnote"></p>
      <button type="button" class="primary" data-close>CLOSE MAP [M]</button></div>`;
  ov.querySelector('.date').textContent = fmtDate(S.day);
  const phase = mapPhase(S.day), LOC = D.chapters.locations;
  const arrows = [], units = [];
  const last = S.trail[S.trail.length - 1];
  if (S.trail.length > 1) arrows.push({ pts: S.trail });
  const next = S.route[S.pos + 1];
  if (S.ch === 1) arrows.push({ pts: [[30, 316], [126, 296]], dash: 1 });
  else if (next && LOC[next] && last) arrows.push({ pts: [last, LOC[next]], dash: 1 });
  if (S.day >= 4) units.push({ p: [210, 100], n: 'MOLA', c: 'u r' });
  if (S.day >= 4 && !(last && last[0] === 152)) units.push({ p: [160, 244], n: 'QUEIPO', c: 'u r' });
  if (phase === 2) units.push({ p: [216, 140], r: 1, n: 'MILICIAS', c: 'ur r' });
  units.push({ p: [242, 54], r: 1, n: 'EUZKADI', c: 'ur r' });
  if (last) units.push({ p: last, you: 1, n: 'YOU', c: 'u you b' });
  const W = 320, H = 180;
  const { fb, fwd } = renderMap(W, H, TACT, { x: 4, y: 16, w: 222, h: 162 }, { grid: 16, phase, arrows, cities: CITIES, units });
  const wrap = ov.querySelector('.mapwrap');
  fb.to(wrap.querySelector('canvas'));
  placeLabels(wrap, fwd, W, H, CITIES);
  placeLabels(wrap, fwd, W, H, units);
  if (S.ch === 1) placeLabels(wrap, fwd, W, H, [{ n: 'FROM THE CANARIES', p: [40, 312], c: 'u r' }]);
  ov.querySelector('.stops').innerHTML = S.route.map((s, i) => `<li class="${i < S.pos ? 'done' : i === S.pos ? 'here' : 'ahead'}">${i < S.pos ? '✓' : i === S.pos ? '▶' : '·'} ${s}</li>`).join('');
  ov.querySelector('.mnote').textContent = ['Front lines as of late July 1936.', 'Front lines as of mid-August 1936.', 'Front lines as of September 1936.'][phase];
  ov.querySelector('[data-close]').addEventListener('click', closeMap);
}

export function closeMap() { document.getElementById('ov-map').hidden = true; }

// Reusable pixel sprites: vehicles, people, aircraft, ships, trees and portraits.
import { FB, vgrad, mix } from './pixel.js';

export function wheel(fb, cx, cy, P) {
  fb.rect(cx - 2, cy - 1, 5, 3, P.outline); fb.rect(cx - 1, cy - 2, 3, 5, P.outline); fb.set(cx, cy, P.hub);
}

export function truck(fb, x, y, P) {
  const o = P.outline;
  fb.rect(x, y - 12, 14, 8, o); fb.rect(x + 1, y - 11, 12, 6, P.canvas); fb.rect(x + 1, y - 11, 12, 1, P.canvasL);
  for (let i = x + 4; i < x + 13; i += 3) fb.rect(i, y - 10, 1, 5, P.canvasD);
  fb.rect(x, y - 4, 23, 2, o); fb.rect(x + 1, y - 4, 21, 1, P.oliveD);
  fb.rect(x + 14, y - 10, 6, 7, o); fb.rect(x + 15, y - 9, 4, 5, P.olive); fb.rect(x + 16, y - 9, 3, 2, P.glass);
  fb.rect(x + 19, y - 7, 4, 5, o); fb.rect(x + 19, y - 6, 3, 3, P.olive);
  wheel(fb, x + 4, y - 1, P); wheel(fb, x + 18, y - 1, P);
}

export function soldier(fb, x, y, P, f) {
  fb.rect(x + 1, y - 9, 2, 1, P.cap); fb.rect(x + 1, y - 8, 2, 1, P.skin);
  fb.rect(x, y - 7, 4, 4, P.olive); fb.set(x, y - 7, P.oliveD); fb.rect(x + 3, y - 7, 1, 4, P.oliveD);
  fb.line(x + 4, y - 11, x + 4, y - 5, P.outline);
  if (f % 2) {
    fb.set(x, y - 3, P.oliveD); fb.set(x - 1, y - 2, P.oliveD); fb.set(x - 1, y - 1, P.outline);
    fb.set(x + 3, y - 3, P.oliveD); fb.set(x + 4, y - 2, P.oliveD); fb.set(x + 4, y - 1, P.outline);
  } else {
    fb.rect(x + 1, y - 3, 1, 2, P.oliveD); fb.rect(x + 2, y - 3, 1, 2, P.oliveD);
    fb.set(x + 1, y - 1, P.outline); fb.set(x + 2, y - 1, P.outline);
  }
}

export function tree(fb, x, y, P, s = 1) {
  fb.rect(x, y - 4, 1, 4, P.trunk);
  fb.disc(x, y - 7 * s, Math.round(3 * s), P.treeD);
  fb.disc(x - 1, y - 8 * s, Math.round(2 * s), P.tree);
  fb.set(x - 2, y - 9 * s, P.treeL); fb.set(x - 1, y - 10 * s, P.treeL);
}

export function house(fb, x, y, w, h, P, R, wall) {
  fb.rect(x, y, w, 2, P.roof);
  fb.rect(x, y + 2, w, h, wall || (R() < 0.5 ? P.stone[0] : P.stone[1]));
  fb.rect(x, y + 2, 1, h, P.stone[1]);
  if (w > 4) fb.set(x + 2, y + 3, P.outline);
}

export function palm(fb, x, y, trunk, fronds = trunk) {
  for (let k = 0; k < 22; k++) fb.rect(x + Math.round(Math.sin(k / 22 * 1.2) * 4), y - k, 2, 1, trunk);
  const tx = x + 4, ty = y - 22;
  [[-10, 3], [-7, -4], [9, 2], [6, -5], [0, -7], [-12, 6], [12, 6]].forEach(([dx, dy]) => {
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let k = 0; k <= n; k++) { const t = k / n; fb.set(tx + dx * t, ty + dy * t + t * t * 3, fronds); }
  });
}

// Junkers Ju 52 trimotor, facing right. c = { b: body, d: dark, l: light, g: glass }
export function ju52(c) {
  const f = new FB(26, 10);
  f.rect(4, 3, 18, 3, c.b); f.rect(22, 3, 2, 3, c.d); f.rect(24, 3, 1, 3, c.l);
  f.rect(5, 5, 16, 1, c.d); for (let x = 6; x < 20; x += 2) f.set(x, 4, c.l);
  f.rect(18, 2, 3, 1, c.g);
  f.rect(1, 0, 3, 3, c.b); f.rect(0, 1, 1, 2, c.b); f.rect(1, 3, 4, 2, c.b); f.rect(0, 4, 6, 1, c.d);
  f.rect(9, 6, 10, 1, c.d); f.rect(14, 5, 4, 2, c.d); f.set(18, 5, c.l);
  f.set(12, 7, c.d); f.rect(11, 8, 3, 2, c.d);
  return f;
}

// de Havilland Dragon Rapide biplane, facing right.
export function rapide() {
  const c = { b: '#e8dcc0', w: '#d4c6a4', wl: '#f4ecd8', d: '#4a4a52', s: '#2e4a8a', g: '#9fc4d8' };
  const f = new FB(36, 14);
  f.rect(8, 1, 21, 2, c.w); f.rect(8, 1, 21, 1, c.wl);
  f.rect(11, 3, 1, 6, c.d); f.rect(25, 3, 1, 6, c.d);
  f.rect(4, 5, 27, 4, c.b); f.rect(31, 6, 3, 2, c.b); f.set(34, 7, c.d);
  f.rect(5, 8, 26, 1, c.d); f.rect(5, 6, 25, 1, c.s);
  for (let x = 14; x < 25; x += 3) f.set(x, 5, c.g);
  f.rect(27, 4, 3, 2, c.g);
  f.rect(1, 1, 4, 5, c.b); f.rect(0, 2, 1, 3, c.b); f.rect(0, 7, 8, 1, c.d);
  f.rect(9, 9, 20, 2, c.w); f.rect(9, 10, 20, 1, c.d);
  f.rect(18, 8, 6, 4, c.d); f.rect(24, 7, 1, 6, c.wl);
  f.rect(20, 12, 3, 2, c.d); f.set(2, 8, c.d);
  return f;
}

export function ship(fb, x, wy, L, P, war) {
  const o = P.shipD;
  for (let r = 0; r < 5; r++) {
    const ins = Math.floor(r * 0.6), len = L - ins - Math.floor(r * 1.6);
    fb.rect(x + ins, wy - 5 + r, len, 1, r === 0 ? P.shipL : (r === 4 ? o : P.ship));
  }
  const sx = x + Math.floor(L * 0.42), sw = Math.max(5, Math.floor(L * 0.24));
  fb.rect(sx, wy - 9, sw, 4, P.ship); fb.rect(sx, wy - 9, sw, 1, P.shipL);
  for (let i = sx + 1; i < sx + sw - 1; i += 2) fb.set(i, wy - 7, o);
  fb.rect(sx + 2, wy - 13, 3, 4, P.funnel); fb.rect(sx + 2, wy - 13, 3, 1, o);
  fb.line(x + 5, wy - 5, x + 5, wy - 14, o); fb.line(x + L - 9, wy - 5, x + L - 9, wy - 12, o);
  if (war) {
    fb.rect(x + L - 14, wy - 7, 4, 2, P.ship); fb.line(x + L - 10, wy - 7, x + L - 6, wy - 8, o);
    fb.rect(x + 8, wy - 7, 4, 2, P.ship); fb.line(x + 8, wy - 7, x + 4, wy - 8, o);
  }
  for (let k = 0; k < 10; k++) fb.disc(sx + 3 - k * 3, wy - 15 - Math.round(k * 1.1), 1 + Math.floor(k / 3), k % 2 ? P.smoke[0] : P.smoke[1]);
  for (let k = 1; k < 14; k++) { fb.set(x - k * 2, wy - 1 + (k & 1), P.foam); if (k < 8) fb.set(x - k * 2, wy + 1 + (k >> 2), P.foam); }
  fb.set(x + L - 2, wy - 1, P.foam); fb.set(x + L - 1, wy, P.foam);
}

// 24x28 bust portrait. t = look traits from data/generals.json.
export function portrait(P, t = {}) {
  const fb = new FB(24, 28), o = P.outline, hair = t.hair || P.hair;
  // t.civil: civilian clothes in t.shirt instead of uniform
  const U = t.civil ? (t.shirt || '#6a5a48') : P.uni, UL = t.civil ? mix(U, '#ffffff', 0.25) : P.uniL, UD = t.civil ? mix(U, '#000000', 0.3) : P.uniD;
  vgrad(fb, 0, 28, P.pbg);
  for (let y = 21; y < 28; y++) { const half = 7 + Math.min(4, y - 21); fb.rect(12 - half, y, half * 2, 1, U); }
  fb.rect(5, 21, 14, 1, UL);
  if (t.civil) { fb.rect(9, 20, 6, 2, '#e8e0d0'); fb.rect(11, 22, 2, 6, UD); }
  else { fb.rect(9, 20, 6, 2, UD); fb.set(9, 21, P.tab); fb.set(14, 21, P.tab); fb.rect(11, 22, 2, 6, UD); }
  if (t.medals && !t.civil) { fb.set(6, 24, P.medal); fb.set(7, 24, P.medal2); fb.set(6, 25, P.medal2); fb.set(7, 25, P.medal); }
  fb.rect(10, 18, 4, 3, P.skinD);
  for (let y = 7; y < 19; y++) {
    const dy = y - 12.5, half = Math.round(Math.sqrt(Math.max(0, 1 - (dy / 6.5) ** 2)) * (t.wide ? 5.6 : 5));
    fb.rect(12 - half, y, half * 2, 1, P.skin);
  }
  for (let y = 9; y < 18; y++) fb.set(16, y, P.skinD);
  fb.set(6, 12, P.skinD); fb.set(6, 13, P.skinD); fb.set(17, 12, P.skinD); fb.set(17, 13, P.skinD);
  fb.rect(8, 11, 3, 1, hair); fb.rect(13, 11, 3, 1, hair);
  fb.set(9, 12, o); fb.set(14, 12, o);
  fb.set(12, 13, P.skinD); fb.set(12, 14, P.skinD); fb.set(11, 14, P.skinD);
  if (t.beard) {
    for (let y = 15; y < 21; y++) { const half = 5 - Math.max(0, y - 17); fb.rect(12 - half, y, half * 2, 1, P.beard); }
    fb.rect(10, 15, 5, 1, P.beard); fb.rect(11, 16, 3, 1, P.skinD);
  } else {
    fb.rect(11, 16, 3, 1, P.skinD);
    if (t.must) fb.rect(10, 15, 5, 1, hair);
  }
  if (t.glasses) {
    [[9, 12], [14, 12]].forEach(([cx, cy]) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) fb.set(cx + dx, cy + dy, o);
      fb.set(cx, cy, P.glassC);
    });
    fb.set(11, 12, o); fb.set(12, 12, o);
  }
  if (t.cap) {
    fb.rect(7, 3, 10, 1, P.capL); fb.rect(6, 4, 12, 4, P.capC); fb.rect(5, 6, 14, 2, P.capC);
    fb.rect(6, 8, 12, 1, P.capBand); fb.rect(6, 9, 12, 1, o);
    fb.set(12, 5, P.badge); fb.set(11, 6, P.badge); fb.set(13, 6, P.badge);
  } else if (t.beret) {
    fb.rect(7, 5, 10, 2, '#2a2a2e'); fb.rect(6, 6, 12, 2, '#2a2a2e'); fb.set(12, 4, '#2a2a2e');
  } else if (t.bald) {
    fb.rect(6, 9, 2, 3, hair); fb.rect(16, 9, 2, 3, hair);
  } else {
    fb.rect(9, 5, 6, 1, hair); fb.rect(7, 6, 10, 2, hair); fb.set(7, 8, hair); fb.set(16, 8, hair);
  }
  if (t.long) { fb.rect(5, 7, 2, 13, hair); fb.rect(17, 7, 2, 13, hair); fb.rect(6, 6, 12, 2, hair); }
  return fb;
}

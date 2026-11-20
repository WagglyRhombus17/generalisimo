// Tenerife: Mount Teide above Santa Cruz harbour.
import { FB, vgrad, sun, hash, rng, dith, streaks } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { house, palm, ship } from '../engine/sprites.js';

const W = 320, H = 180;

export function island() {
  const P = palFor('day'), fb = new FB(W, H), R = rng(21);
  vgrad(fb, 0, 98, P.sky);
  sun(fb, 268, 38, 9, P.sun, P.glow);
  streaks(fb, P.cloud, [[16, 36, 60], [214, 52, 50]]);
  for (let x = 0; x < W; x++) {
    const t = Math.round(Math.min(74 - 6 * Math.sin(x * 0.05), 30 + Math.abs(x - 150) * 0.55));
    for (let y = t; y < 98; y++) {
      let c = y === t ? P.hillFarL : P.hillFar;
      if (y < 48 && y < t + 8 && dith(x, y, 0.75)) c = '#f4f4fa';
      else if (hash(x, y, 8) < 0.06) c = P.hillFarL;
      fb.set(x, y, c);
    }
  }
  for (let x = 0; x < W; x++) for (let y = 62; y < 69; y++) if (dith(x, y, 0.35 + 0.25 * Math.sin(x * 0.07))) fb.set(x, y, '#f0eef4');
  vgrad(fb, 98, H, P.sea);
  const shore = x => Math.round(124 - (x - 200) * 0.32);
  for (let x = 200; x < W; x++) for (let y = shore(x); y < H; y++) fb.set(x, y, hash(x, y, 2) < 0.1 ? P.ground[1] : P.ground[0]);
  for (let i = 0; i < 40; i++) {
    const hx = 204 + Math.floor(R() * 112), top = shore(hx);
    house(fb, hx, top + 2 + Math.floor(R() * 16), 5 + Math.floor(R() * 3), 3 + Math.floor(R() * 3), P, R, R() < 0.6 ? P.white : P.stone[0]);
  }
  fb.rect(166, 120, 36, 2, P.stone[1]);
  palm(fb, 300, 150, P.trunk, P.treeD); palm(fb, 276, 156, P.trunk, P.treeD);
  const foam = Array.from({ length: 150 }, () => { const y = 100 + Math.floor(R() * 80); return [Math.floor(R() * 200), y, 1 + Math.floor((y - 98) / 18)]; });

  return {
    base: fb,
    frame(f, t) {
      const tick = Math.floor(t * 2);
      foam.forEach(([x, y, l], i) => { if (hash(i, tick, 7) < 0.3) return; for (let k = 0; k < l; k++) f.set(x + k, y, P.foam); });
      ship(f, Math.round(((20 + t * 3) % 230) - 40), 116, 44, P, false);
      for (let b = 0; b < 3; b++) {
        const a = t * 0.6 + b * 2.1, bx = Math.round(130 + b * 22 + 26 * Math.cos(a)), by = Math.round(56 + b * 4 + 6 * Math.sin(a));
        const up = Math.floor(t * 4 + b) % 2;
        f.set(bx - 2, by - up, P.outline); f.set(bx - 1, by - 1 + up, P.outline); f.set(bx, by, P.outline); f.set(bx + 1, by - 1 + up, P.outline); f.set(bx + 2, by - up, P.outline);
      }
    }
  };
}

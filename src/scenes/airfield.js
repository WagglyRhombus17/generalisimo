// Gando airfield, Gran Canaria: the Dragon Rapide warms up on the strip.
import { FB, vgrad, sun, hash, rng, dith, streaks } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { palm, rapide, soldier } from '../engine/sprites.js';

const W = 320, H = 180;

export function airfield() {
  const P = palFor('day'), fb = new FB(W, H), R = rng(5);
  const volc = '#7a5a52', volcL = '#9a7466', tarmac = '#8a8478', tarmacD = '#6e695f', hangar = '#b8b0a0', hangarD = '#8a8274';
  vgrad(fb, 0, 98, P.sky);
  sun(fb, 60, 36, 10, P.sun, P.glow);
  streaks(fb, P.cloud, [[110, 38, 60], [230, 32, 44]]);
  for (let x = 0; x < W; x++) {
    let t = Math.round(66 + 10 * Math.sin(x * 0.045 + 1) + 6 * Math.sin(x * 0.13) + hash(x >> 2, 1, 4) * 4);
    if (x < 100) t = Math.max(t, 88);
    for (let y = t; y < 98; y++) fb.set(x, y, y < t + 2 ? volcL : (hash(x, y, 6) < 0.08 ? volcL : volc));
  }
  for (let x = 0; x < 100; x++) for (let y = 90; y < 98; y++) fb.set(x, y, dith(x, y, 0.4) ? P.sea[1] : P.sea[0]);
  for (let x = 0; x < W; x++) for (let y = 98; y < H; y++) {
    let c = dith(x, y, Math.min(1, (y - 98) / 50)) ? P.ground[1] : P.ground[0];
    if (hash(x, y, 7) < 0.04) c = P.ground[2];
    fb.set(x, y, c);
  }
  for (let x = 0; x < W; x++) for (let y = 118; y < 130; y++) {
    let c = tarmac;
    if (y === 118 || y === 129) c = tarmacD;
    else if (y === 124 && (x % 16) < 8) c = '#e8e0c8';
    fb.set(x, y, c);
  }
  for (let x = 218; x < 290; x++) {
    const top = Math.round(86 + ((x - 254) / 36) ** 2 * 8);
    for (let y = top; y < 116; y++) fb.set(x, y, x % 5 === 0 ? hangarD : hangar);
    fb.set(x, top, hangarD);
  }
  fb.rect(236, 100, 34, 16, '#2a2622');
  fb.rect(302, 86, 1, 30, P.outline);
  fb.blit(rapide(), 90, 92, 2);
  palm(fb, 18, 120, P.trunk, P.treeD); palm(fb, 40, 114, P.trunk, P.treeD);
  for (let i = 0; i < 20; i++) { const x = Math.floor(R() * W), y = 134 + Math.floor(R() * 40); fb.rect(x, y, 3, 1, P.treeD); }

  return {
    base: fb,
    frame(f, t) {
      // propellers: the nose and the engine nacelle on the lower wing
      const on = Math.floor(t * 12) % 2;
      for (let y = 100; y < 118; y++) if ((y + on) % 2) f.set(160, y, '#f4ecd8');
      for (let y = 108; y < 120; y++) if ((y + on) % 3 === 0) f.set(139, y, '#f4ecd8');
      // windsock
      const flap = Math.floor(t * 3) % 3;
      for (let k = 0; k < 8; k++) f.rect(303 + k, 87 + (k >> 2) + (flap === 1 && k > 4 ? 1 : 0) - (flap === 2 && k > 5 ? 1 : 0), 1, 3, k % 4 < 2 ? '#e86a2a' : '#f4ecd8');
      // ground crew walking to and from the plane
      const span = 50, p = (t * 7) % (span * 2), x = p < span ? 196 - p : 196 - (span * 2 - p);
      soldier(f, Math.round(x), 124, P, Math.floor(t * 4));
      soldier(f, 178, 124, P, 0); soldier(f, 186, 125, P, 1);
    }
  };
}

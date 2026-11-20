// Gando airfield, Gran Canaria: the Dragon Rapide waits on the strip.
import { FB, vgrad, sun, hash, rng, dith, streaks } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { palm, rapide, soldier } from '../engine/sprites.js';

export function airfield() {
  const P = palFor('day'), W = 320, H = 180, fb = new FB(W, H), R = rng(5);
  const volc = '#7a5a52', volcL = '#9a7466', tarmac = '#8a8478', tarmacD = '#6e695f', hangar = '#b8b0a0', hangarD = '#8a8274';
  vgrad(fb, 0, 98, P.sky);
  sun(fb, 60, 22, 10, P.sun, P.glow);
  streaks(fb, P.cloud, [[110, 26, 60], [230, 18, 44]]);
  for (let x = 0; x < W; x++) {
    let t = Math.round(66 + 10 * Math.sin(x * 0.045 + 1) + 6 * Math.sin(x * 0.13) + hash(x >> 2, 1, 4) * 4);
    if (x < 100) t = Math.max(t, 90 - Math.round((100 - x) * 0.0));
    for (let y = t; y < 98; y++) fb.set(x, y, y < t + 2 ? volcL : (hash(x, y, 6) < 0.08 ? volcL : volc));
  }
  for (let x = 0; x < 100; x++) for (let y = 90; y < 98; y++) fb.set(x, y, dith(x, y, 0.4) ? P.sea[1] : P.sea[0]);
  for (let x = 0; x < W; x++) for (let y = 98; y < H; y++) {
    let c = dith(x, y, Math.min(1, (y - 98) / 50)) ? P.ground[1] : P.ground[0];
    if (hash(x, y, 7) < 0.04) c = P.ground[2];
    fb.set(x, y, c);
  }
  for (let x = 0; x < W; x++) for (let y = 128; y < 142; y++) {
    let c = tarmac;
    if (y === 128 || y === 141) c = tarmacD;
    else if (y === 134 && (x % 16) < 8) c = '#e8e0c8';
    fb.set(x, y, c);
  }
  for (let x = 218; x < 290; x++) {
    const top = Math.round(92 + ((x - 254) / 36) ** 2 * 8);
    for (let y = top; y < 120; y++) fb.set(x, y, x % 5 === 0 ? hangarD : hangar);
    fb.set(x, top, hangarD);
  }
  fb.rect(236, 104, 34, 16, '#2a2622');
  fb.rect(302, 92, 1, 30, P.outline);
  for (let k = 0; k < 8; k++) fb.rect(303 + k, 93 + (k >> 2), 1, 3, k % 4 < 2 ? '#e86a2a' : '#f4ecd8');
  fb.blit(rapide(), 90, 104, 2);
  soldier(fb, 168, 132, P, 0); soldier(fb, 176, 132, P, 1); soldier(fb, 190, 133, P, 0);
  palm(fb, 18, 132, P.trunk, P.treeD); palm(fb, 40, 126, P.trunk, P.treeD);
  for (let i = 0; i < 20; i++) { const x = Math.floor(R() * W), y = 146 + Math.floor(R() * 30); fb.rect(x, y, 3, 1, P.treeD); }
  return { base: fb };
}

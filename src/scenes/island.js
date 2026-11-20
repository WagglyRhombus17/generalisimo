// Tenerife: Mount Teide above Santa Cruz harbour.
import { FB, vgrad, sun, hash, rng, dith, streaks } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { house, palm, ship } from '../engine/sprites.js';

export function island() {
  const P = palFor('day'), W = 320, H = 180, fb = new FB(W, H), R = rng(21);
  vgrad(fb, 0, 104, P.sky);
  sun(fb, 268, 24, 9, P.sun, P.glow);
  streaks(fb, P.cloud, [[16, 28, 60], [214, 46, 50]]);
  for (let x = 0; x < W; x++) {
    const t = Math.round(Math.min(76 - 6 * Math.sin(x * 0.05), 26 + Math.abs(x - 150) * 0.55));
    for (let y = t; y < 104; y++) {
      let c = y === t ? P.hillFarL : P.hillFar;
      if (y < 46 && y < t + 8 && dith(x, y, 0.75)) c = '#f4f4fa';
      else if (hash(x, y, 8) < 0.06) c = P.hillFarL;
      fb.set(x, y, c);
    }
  }
  for (let x = 0; x < W; x++) for (let y = 64; y < 71; y++) if (dith(x, y, 0.35 + 0.25 * Math.sin(x * 0.07))) fb.set(x, y, '#f0eef4');
  vgrad(fb, 104, H, P.sea);
  for (let i = 0; i < 160; i++) {
    const y = 106 + Math.floor(R() * 74), x = Math.floor(R() * W), l = 1 + Math.floor((y - 104) / 18);
    for (let k = 0; k < l; k++) fb.set(x + k, y, P.foam);
  }
  const shore = x => Math.round(150 - (x - 180) * 0.3);
  for (let x = 180; x < W; x++) for (let y = shore(x); y < H; y++) fb.set(x, y, hash(x, y, 2) < 0.1 ? P.ground[1] : P.ground[0]);
  for (let i = 0; i < 40; i++) {
    const hx = 186 + Math.floor(R() * 130), top = shore(hx);
    house(fb, hx, top + 2 + Math.floor(R() * 22), 5 + Math.floor(R() * 3), 3 + Math.floor(R() * 3), P, R, R() < 0.6 ? P.white : P.stone[0]);
  }
  fb.rect(150, 150, 40, 2, P.stone[1]);
  ship(fb, 64, 140, 46, P, false);
  palm(fb, 300, 178, P.trunk, P.treeD); palm(fb, 270, 182, P.trunk, P.treeD);
  return { base: fb };
}

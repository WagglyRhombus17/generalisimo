// The Strait of Gibraltar: convoy, Republican destroyer, the Rock, Junkers overhead.
import { FB, vgrad, sun, hash, rng, streaks } from '../engine/pixel.js';
import { VGA } from '../engine/palettes.js';
import { ju52, ship } from '../engine/sprites.js';

export function strait() {
  const P = VGA, W = 320, H = 180, fb = new FB(W, H);
  vgrad(fb, 0, 80, P.sky);
  sun(fb, 250, 26, 9, P.sun, P.glow);
  streaks(fb, P.cloud, [[20, 20, 50], [120, 34, 60], [70, 52, 40]]);
  for (let x = 0; x < W; x++) {
    let t = Math.round(74 - 3 * Math.sin(x * 0.04) - 2 * Math.sin(x * 0.11 + 1)), steep = false;
    const rock = x > 196 && x < 278;
    if (rock) {
      const u = (x - 196) / 82;
      const f = u < 0.76 ? Math.pow(u / 0.76, 0.85) : Math.max(0, 1 - Math.pow((u - 0.76) / 0.24, 0.7));
      t = Math.min(t, Math.round(75 - 38 * f)); steep = u >= 0.76;
    }
    for (let y = t; y < 80; y++) {
      let c = rock ? P.rock : P.hillFar;
      if (y === t) c = rock ? P.rockL : P.hillFarL;
      else if (steep && hash(x, y, 2) < 0.35) c = P.rockL;
      else if (rock && y > t + 8 && hash(x, y, 6) < 0.15) c = P.rockD;
      fb.set(x, y, c);
    }
  }
  vgrad(fb, 80, H, P.sea);
  const R = rng(3);
  for (let i = 0; i < 280; i++) {
    const y = 82 + Math.floor(Math.pow(R(), 0.8) * 98), x = Math.floor(R() * W), l = 1 + Math.floor((y - 80) / 16);
    for (let k = 0; k < l; k++) fb.set(x + k, y, P.foam);
  }
  ship(fb, 18, 92, 28, P, true);
  for (let k = 0; k < 4; k++) fb.set(47 + k, 86 - (k >> 1), P.sun);
  const sp = [128, 104];
  for (let k = 0; k < 8; k++) { fb.set(sp[0] + (k & 1), sp[1] - k, P.foam); fb.set(sp[0] - 2 - (k >> 2), sp[1] - k + 2, P.foam); fb.set(sp[0] + 3 + (k >> 2), sp[1] - k + 2, P.foam); }
  [[204, 100, 36, 0], [142, 110, 46, 0], [92, 118, 30, 1]].forEach(([x, y, l, w]) => ship(fb, x, y, l, P, !!w));
  const pc = { b: P.plane, d: P.planeD, l: P.planeL, g: P.glass };
  [[52, 16], [80, 25], [40, 32]].forEach(([x, y]) => fb.blit(ju52(pc), x, y));
  return { base: fb };
}

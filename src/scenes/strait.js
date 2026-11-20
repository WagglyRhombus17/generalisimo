// The Strait of Gibraltar: convoy, Republican destroyer, the Rock, Junkers overhead.
import { FB, vgrad, sun, hash, rng, streaks } from '../engine/pixel.js';
import { VGA } from '../engine/palettes.js';
import { ju52, ship } from '../engine/sprites.js';

const W = 320, H = 180;

export function strait() {
  const P = VGA, fb = new FB(W, H);
  vgrad(fb, 0, 80, P.sky);
  sun(fb, 250, 40, 9, P.sun, P.glow);
  streaks(fb, P.cloud, [[20, 34, 50], [120, 44, 60], [70, 58, 40]]);
  for (let x = 0; x < W; x++) {
    let t = Math.round(74 - 3 * Math.sin(x * 0.04) - 2 * Math.sin(x * 0.11 + 1)), steep = false;
    const rock = x > 196 && x < 278;
    if (rock) {
      const u = (x - 196) / 82;
      const f = u < 0.76 ? Math.pow(u / 0.76, 0.85) : Math.max(0, 1 - Math.pow((u - 0.76) / 0.24, 0.7));
      t = Math.min(t, Math.round(75 - 34 * f)); steep = u >= 0.76;
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
  const foam = Array.from({ length: 260 }, () => {
    const y = 82 + Math.floor(Math.pow(R(), 0.8) * 98);
    return [Math.floor(R() * W), y, 1 + Math.floor((y - 80) / 16)];
  });
  const pc = { b: P.plane, d: P.planeD, l: P.planeL, g: P.glass };
  const plane = ju52(pc);

  return {
    base: fb,
    frame(f, t) {
      const tick = Math.floor(t * 2);
      foam.forEach(([x, y, l], i) => {
        if (hash(i, tick, 4) < 0.25) return;
        const fx = Math.round(x - t * (2 + (y - 80) / 30)) % W;
        for (let k = 0; k < l; k++) f.set((fx + W + k) % W, y, P.foam);
      });
      const drift = n => ((n + 60 + t * 2.2) % (W + 120)) - 60;
      ship(f, Math.round(drift(18)), 92, 28, P, true);
      if (t % 4 < 0.25) for (let k = 0; k < 4; k++) f.set(Math.round(drift(18)) + 29 + k, 86 - (k >> 1), P.sun);
      const ph = (t % 3) / 3, sx = 112 + Math.round(40 * Math.sin(Math.floor(t / 3) * 2.1));
      if (ph < 0.6) {
        const hgt = Math.round(10 * Math.sin(ph / 0.6 * Math.PI));
        for (let k = 0; k < hgt; k++) { f.set(sx + (k & 1), 106 - k, P.foam); if (k > 2) { f.set(sx - 2, 107 - k + 2, P.foam); f.set(sx + 3, 107 - k + 2, P.foam); } }
      }
      [[204, 100, 36, 0], [142, 110, 46, 0], [92, 118, 30, 1]].forEach(([x, y, l, w]) => ship(f, Math.round(drift(x)), y, l, P, !!w));
      [[52, 34], [80, 42], [40, 50]].forEach(([x, y]) => f.blit(plane, Math.round(((x + 30 + t * 9) % (W + 60)) - 30), y + Math.round(Math.sin(t * 1.3 + x) * 0.6)));
    }
  };
}

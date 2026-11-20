// The march: a side-on road scene with a town on the horizon and the column moving along it.
import { FB, vgrad, sun, hash, rng, dith, streaks } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { truck, soldier, tree, house, palm } from '../engine/sprites.js';

const W = 320, H = 180;
const SUN = { sunset: [62, 70, 11], day: [64, 22, 10], dawn: [44, 80, 13] };
const plainTop = x => Math.round(100 - 2 * Math.sin(x * 0.05) - 1.5 * Math.sin(x * 0.13 + 1));

function hill(fb, P, cx, hw, top, x0, x1 = W) {
  const t = x => Math.round(top + ((x - cx) / hw) ** 2 * 22);
  for (let x = x0; x < x1; x++) {
    const h = Math.min(t(x), 104);
    for (let y = h; y < 106; y++) fb.set(x, y, y < h + 2 ? P.hillMidL : (hash(x, y, 3) < 0.08 ? P.hillMidL : P.hillMid));
  }
  return t;
}

function spire(fb, x, y, w, c) { for (let k = 0; k * 2 < w; k++) fb.rect(x + k, y - k, w - 2 * k, 1, c); }

function alcazar(fb, cx, gy, P) {
  const w = 34, h = 16, x = cx - 17, y = gy - h;
  [x + 5, x + w - 9].forEach(tx => { fb.rect(tx, y - 6, 5, 7, P.stone[1]); spire(fb, tx, y - 7, 5, P.slate); });
  fb.rect(x - 1, y - 1, w + 2, h + 1, P.outline); fb.rect(x, y, w, h, P.stone[0]);
  for (let j = y; j < gy; j++) for (let i = x; i < x + w; i++) if (hash(i, j, 9) < 0.12) fb.set(i, j, P.stone[1]);
  for (let r = 0; r < 3; r++) for (let i = x + 4; i < x + w - 3; i += 4) fb.set(i, y + 3 + r * 4, P.outline);
  [x - 3, x + w - 3].forEach(tx => {
    fb.rect(tx - 1, y - 9, 8, 10, P.outline); fb.rect(tx, y - 8, 6, 9, P.stone[0]); fb.rect(tx + 5, y - 8, 1, 9, P.stone[1]);
    spire(fb, tx - 1, y - 10, 8, P.slate); fb.set(tx + 2, y - 5, P.outline);
  });
  fb.rect(x + w - 13, y, 7, 3, P.stone[1]); fb.set(x + w - 11, y, P.outline); fb.set(x + w - 9, y + 1, P.outline);
  for (let k = 0; k < 16; k++) fb.disc(x + w - 10 + Math.round(k * 1.6 + Math.sin(k * 0.8) * 2), y - 4 - k * 3, 1 + (k >> 2), k % 2 ? P.smoke[0] : P.smoke[1]);
}

function cathedral(fb, x, gy, P) {
  fb.rect(x + 5, gy - 12, 14, 12, P.stone[1]); fb.rect(x + 5, gy - 13, 14, 2, P.roof);
  fb.rect(x - 1, gy - 27, 7, 27, P.outline); fb.rect(x, gy - 26, 5, 26, P.stone[0]);
  fb.set(x + 2, gy - 22, P.outline); fb.set(x + 2, gy - 16, P.outline);
  spire(fb, x - 1, gy - 28, 7, P.slate); fb.set(x + 2, gy - 32, P.slate);
}

// Each town draws either before the plain (on a hill) or after it (on flat ground).
const TOWNS = {
  toledo: {
    pre(fb, P, R) {
      const t = hill(fb, P, 254, 50, 78, 186);
      cathedral(fb, 222, t(222) + 5, P);
      for (let i = 0; i < 34; i++) {
        const hx = 196 + Math.floor(R() * 110), ht = t(hx);
        if (ht > 92) continue;
        house(fb, hx, ht + 3 + Math.floor(R() * 7), 4 + Math.floor(R() * 5), 3 + Math.floor(R() * 4), P, R);
      }
      alcazar(fb, 262, t(262) + 3, P);
    }
  },
  walled: {
    pre(fb, P, R) {
      const cx = 240, t = hill(fb, P, cx, 64, 80, 160);
      for (let i = 0; i < 30; i++) {
        const hx = cx - 50 + Math.floor(R() * 100), ht = t(hx);
        if (ht > 90) continue;
        house(fb, hx, ht + 1 + Math.floor(R() * 4), 4 + Math.floor(R() * 4), 3 + Math.floor(R() * 3), P, R);
      }
      const kt = t(cx + 16);
      fb.rect(cx + 10, kt - 16, 12, 17, P.outline); fb.rect(cx + 11, kt - 15, 10, 16, P.stone[0]);
      for (let k = 0; k < 5; k++) fb.rect(cx + 11 + k * 2, kt - 17, 1, 2, P.stone[0]);
      fb.rect(cx + 20, kt - 15, 1, 16, P.stone[1]); fb.set(cx + 15, kt - 10, P.outline); fb.set(cx + 15, kt - 6, P.outline);
      for (let x = cx - 62; x <= cx + 62; x++) {
        const wy = Math.min(t(x) + 9, 98);
        fb.rect(x, wy, 1, 8, x % 9 === 0 ? P.stone[1] : P.stone[0]); fb.set(x, wy + 7, P.stone[1]);
        if (x % 4 < 2) fb.set(x, wy - 1, P.stone[0]);
      }
      for (let x = cx - 60; x <= cx + 60; x += 20) {
        const wy = Math.min(t(x) + 9, 98);
        fb.rect(x - 2, wy - 4, 6, 12, P.outline); fb.rect(x - 1, wy - 3, 4, 11, P.stone[0]);
      }
    }
  },
  village: {
    pre(fb, P, R) {
      const cx = 228, t = hill(fb, P, cx, 70, 88, 150);
      for (let i = 0; i < 22; i++) {
        const hx = cx - 54 + Math.floor(R() * 108), ht = t(hx);
        if (ht > 96) continue;
        house(fb, hx, ht + 1 + Math.floor(R() * 4), 5 + Math.floor(R() * 3), 3 + Math.floor(R() * 3), P, R, P.white);
      }
      const ct = t(cx) + 2;
      fb.rect(cx - 1, ct - 20, 7, 21, P.outline); fb.rect(cx, ct - 19, 5, 20, P.white);
      fb.rect(cx + 1, ct - 16, 3, 3, P.outline); fb.set(cx + 2, ct - 15, P.gold);
      spire(fb, cx - 1, ct - 21, 7, P.roof);
      fb.rect(cx + 5, ct - 9, 12, 9, P.white); fb.rect(cx + 5, ct - 10, 12, 1, P.roof);
    }
  },
  seville: {
    post(fb, P, R) {
      const g = 99;
      for (let i = 0; i < 26; i++) {
        const hx = 172 + i * 5 + Math.floor(R() * 3), hh = 3 + Math.floor(R() * 5);
        house(fb, hx, g - hh - 2, 5, hh, P, R, P.white);
      }
      fb.rect(212, g - 17, 36, 17, P.stone[1]); fb.rect(212, g - 17, 36, 1, P.stone[0]);
      for (let i = 0; i < 8; i++) fb.rect(212 + i * 5, g - 20, 2, 3, P.stone[1]);
      for (let i = 0; i < 5; i++) fb.set(216 + i * 7, g - 11, P.outline);
      const gx = 250;
      fb.rect(gx - 1, g - 46, 9, 46, P.outline); fb.rect(gx, g - 45, 7, 45, P.stone[0]); fb.rect(gx + 6, g - 45, 1, 45, P.stone[1]);
      for (let k = 0; k < 5; k++) fb.set(gx + 3, g - 40 + k * 7, P.outline);
      fb.rect(gx + 1, g - 55, 5, 9, P.outline); fb.rect(gx + 2, g - 54, 3, 8, P.white);
      fb.set(gx + 3, g - 52, P.outline); fb.set(gx + 3, g - 51, P.outline);
      fb.rect(gx + 2, g - 59, 3, 4, P.stone[0]); fb.set(gx + 3, g - 61, P.outline); fb.set(gx + 3, g - 62, P.gold);
      palm(fb, 176, 104, P.trunk, P.treeD); palm(fb, 292, 104, P.trunk, P.treeD); palm(fb, 304, 106, P.trunk, P.treeD);
    }
  },
  aqueduct: {
    post(fb, P, R) {
      const g = 100;
      for (let i = 0; i < 9; i++) { const hx = 92 + i * 6; house(fb, hx, g - 6 - Math.floor(R() * 3), 5, 4, P, R, P.white); }
      for (let x = 150; x < 316; x += 13) {
        fb.rect(x, g - 30, 5, 30, P.stone[1]); fb.rect(x, g - 30, 1, 30, P.stone[0]);
        for (let y = g - 28; y < g; y += 5) fb.rect(x, y, 5, 1, P.roof);
      }
      fb.rect(150, g - 31, 166, 2, P.stone[0]); fb.rect(150, g - 16, 166, 2, P.stone[1]);
      for (let x = 155; x < 316; x += 13) for (let k = 0; k < 8; k++) fb.set(x + k, g - 29 + Math.round(Math.abs(k - 3.5) * 0.6), P.stone[1]);
      // stork nests on the pillars
      [163, 202, 254, 293].forEach(x => { fb.rect(x - 1, g - 34, 6, 3, P.trunk); fb.rect(x + 1, g - 37, 2, 3, P.white); fb.set(x + 3, g - 37, P.roof); });
    }
  }
};

export function road(o = {}) {
  const sky = o.sky || 'sunset', P = palFor(sky), fb = new FB(W, H), R = rng(o.seed || 7);
  vgrad(fb, 0, 96, P.sky);
  const s = SUN[sky] || SUN.sunset;
  sun(fb, s[0], s[1], s[2], P.sun, P.glow);
  streaks(fb, P.cloud, [[14, 30, 58], [96, 22, 44], [150, 40, 66], [224, 18, 40], [268, 46, 44]]);
  for (let x = 0; x < W; x++) {
    const t = Math.round(84 - 6 * Math.sin(x * 0.03 + 1) - 4 * Math.sin(x * 0.071 + 2) - 2 * Math.sin(x * 0.19));
    for (let y = t; y < 100; y++) fb.set(x, y, y === t ? P.hillFarL : P.hillFar);
  }
  const town = TOWNS[o.town] || {};
  if (town.pre) town.pre(fb, P, R);
  for (let x = 0; x < W; x++) {
    const t = plainTop(x);
    for (let y = t; y < H; y++) {
      let c = dith(x, y, Math.min(1, (y - t) / 40)) ? P.ground[1] : P.ground[0];
      if (y > 128 && dith(x, y, (y - 128) / 40)) c = P.ground[2];
      if (hash(x, y, 4) < 0.05) c = P.ground[2];
      fb.set(x, y, c);
    }
  }
  if (town.post) town.post(fb, P, R);
  [8, 46, 104, 140].forEach(x => tree(fb, x, 104, P));
  for (let x = 0; x < W; x++) for (let y = 108; y < 118; y++) {
    let c = P.road;
    if (y === 108 || y === 117) c = P.roadD;
    else if ((y === 111 || y === 114) && hash(x, y) < 0.5) c = P.rut;
    fb.set(x, y, c);
  }
  const poles = [18, 78, 138, 198, 258, 318];
  poles.forEach(px => { fb.rect(px, 86, 1, 21, P.pole); fb.rect(px - 2, 88, 5, 1, P.pole); });
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1];
    for (let x = a; x <= b; x++) fb.set(x, 88 + Math.round(Math.sin(Math.PI * (x - a) / (b - a)) * 4), P.pole);
  }
  [148, 214, 296].forEach(x => tree(fb, x, 136, P, 1.4));
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(R() * W), y = 122 + Math.floor(R() * 50);
    fb.rect(x, y, 3, 1, P.treeD); fb.set(x + 1, y - 1, P.tree);
  }
  return { base: fb, frame: (f, t) => convoy(f, P, t) };
}

// The moving column, drawn each frame on top of the static background.
function convoy(fb, P, t) {
  const span = W + 160, off = Math.floor(t * 7) % span;
  const wrap = x => ((x + off) % span) - 80;
  const R = rng(3);
  [24, 56, 88].forEach(bx => {
    const x = wrap(bx);
    for (let k = 0; k < 50; k++) {
      const dx = Math.floor(R() * 16), dy = Math.floor(R() * 7);
      if (R() < 0.6 - dx / 30) fb.set(x - 2 - dx, 110 + dy, P.dust);
    }
    truck(fb, x, 116, P);
  });
  const step = Math.floor(t * 4);
  for (let i = 0; i < 10; i++) soldier(fb, wrap(122 + i * 6), 117, P, i + step);
}

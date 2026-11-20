// Tiny pixel framebuffer used by every scene, sprite and map.
// Scenes draw at 320x180 and the browser scales them up with crisp pixels.

const CACHE = new Map();

export function rgb(h) {
  let v = CACHE.get(h);
  if (!v) {
    const n = parseInt(h.slice(1, 7), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    CACHE.set(h, v);
  }
  return v;
}

export class FB {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }

  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const v = rgb(c), i = (y * this.w + x) * 4;
    this.d[i] = v[0]; this.d[i + 1] = v[1]; this.d[i + 2] = v[2]; this.d[i + 3] = 255;
  }

  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }

  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) this.set(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c);
  }

  disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) this.set(cx + x, cy + y, c);
  }

  // Copy another framebuffer onto this one, skipping transparent pixels, at an integer scale.
  blit(s, dx, dy, sc = 1) {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const i = (y * s.w + x) * 4;
      if (!s.d[i + 3]) continue;
      for (let j = 0; j < sc; j++) for (let k = 0; k < sc; k++) {
        const px = dx + x * sc + k, py = dy + y * sc + j;
        if (px < 0 || py < 0 || px >= this.w || py >= this.h) continue;
        const o = (py * this.w + px) * 4;
        this.d[o] = s.d[i]; this.d[o + 1] = s.d[i + 1]; this.d[o + 2] = s.d[i + 2]; this.d[o + 3] = 255;
      }
    }
  }

  copy() { const f = new FB(this.w, this.h); f.d.set(this.d); return f; }

  to(cv) {
    if (cv.width !== this.w) cv.width = this.w;
    if (cv.height !== this.h) cv.height = this.h;
    cv.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
  }
}

// 4x4 ordered dithering
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
export const dith = (x, y, f) => f * 16 > B4[y & 3][x & 3];

export function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Visual-only random numbers (scenery). Game randomness lives in game/state.js.
export function rng(s) {
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Vertical dithered gradient through a list of colours.
export function vgrad(fb, y0, y1, cols, x0 = 0, x1 = fb.w) {
  const n = cols.length - 1;
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1) * n;
    const i = Math.min(n - 1, Math.floor(t)), f = t - i;
    for (let x = x0; x < x1; x++) fb.set(x, y, dith(x, y, f) ? cols[i + 1] : cols[i]);
  }
}

export function sun(fb, cx, cy, r, c, glow) {
  for (let y = -r - 8; y <= r + 8; y++) for (let x = -r - 8; x <= r + 8; x++) {
    const d = Math.hypot(x, y);
    if (d <= r) fb.set(cx + x, cy + y, c);
    else if (glow && d <= r + 8 && dith(cx + x, cy + y, 0.8 - (d - r) / 8 * 0.8)) fb.set(cx + x, cy + y, glow);
  }
}

// Thin horizontal cloud streaks: list of [x, y, length].
export function streaks(fb, c, list) {
  list.forEach(([x, y, l]) => {
    for (let i = 0; i < l; i++) { fb.set(x + i, y, c); if (i > 5 && i < l - 6) fb.set(x + i + 4, y + 1, c); }
  });
}

// A round cumulus puff with a shaded underside.
export function puff(fb, cx, cy, r, c, shade) {
  fb.disc(cx, cy + 2, r, shade);
  fb.disc(cx - r, cy + 3, Math.max(1, r - 2), shade);
  fb.disc(cx + r, cy + 3, Math.max(1, r - 3), shade);
  fb.disc(cx, cy, r, c);
  fb.disc(cx - r, cy + 1, Math.max(1, r - 2), c);
  fb.disc(cx + r, cy + 1, Math.max(1, r - 3), c);
}

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export function lum(h) { const [r, g, b] = rgb(h); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; }

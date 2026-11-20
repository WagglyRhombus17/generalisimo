// In flight over the Atlantic, with the African coast on the horizon.
import { FB, vgrad, rng, puff } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { rapide } from '../engine/sprites.js';

const W = 320, H = 180;

export function sky() {
  const P = palFor('day'), fb = new FB(W, H), R = rng(9);
  vgrad(fb, 0, 118, ['#2f5fae', '#4a7cc4', '#76a0d4', '#a8c4e0', '#d8e4ec']);
  vgrad(fb, 118, H, P.sea);
  for (let x = 196; x < W; x++) { const t = 116 - Math.round((x - 196) / 40); for (let y = t; y < 119; y++) fb.set(x, y, '#9a7a5a'); }
  const foam = Array.from({ length: 90 }, () => { const y = 121 + Math.floor(R() * 58); return [Math.floor(R() * W), y, 2 + Math.floor((y - 118) / 12)]; });
  const low = [[30, 128, 9], [80, 134, 12], [150, 126, 8], [210, 136, 13], [280, 128, 10], [120, 146, 11], [250, 150, 9]];
  const high = [[40, 40, 6], [250, 34, 7], [300, 70, 5]];
  const plane = rapide();

  return {
    base: fb,
    frame(f, t) {
      const span = pad => W + pad * 2;
      const wrap = (x, v, pad = 30) => ((((x + pad - t * v) % span(pad)) + span(pad)) % span(pad)) - pad;
      foam.forEach(([x, y, l]) => f.rect(Math.round(wrap(x, 18, 4)), y, l, 1, P.foam));
      high.forEach(([x, y, r]) => puff(f, Math.round(wrap(x, 4)), y, r, '#ffffff', '#c8d4e4'));
      const bob = Math.round(Math.sin(t * 1.6) * 1.5);
      f.blit(plane, 104, 52 + bob, 3);
      const on = Math.floor(t * 12) % 2;
      for (let y = 73; y < 91; y++) if ((y + on) % 2) f.set(178, y + bob, '#f4ecd8');
      [68, 76, 84].forEach((y, i) => f.rect(Math.round(86 - ((t * 40 + i * 13) % 44)), y + bob, 14, 1, '#e4ecf4'));
      low.forEach(([x, y, r]) => puff(f, Math.round(wrap(x, 14)), y, r, '#ffffff', '#c8d4e4'));
    }
  };
}

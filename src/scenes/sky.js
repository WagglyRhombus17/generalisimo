// In flight over the Atlantic, with the African coast on the horizon.
import { FB, vgrad, rng, puff } from '../engine/pixel.js';
import { palFor } from '../engine/palettes.js';
import { rapide } from '../engine/sprites.js';

export function sky() {
  const P = palFor('day'), W = 320, H = 180, fb = new FB(W, H), R = rng(9);
  vgrad(fb, 0, 138, ['#2f5fae', '#4a7cc4', '#76a0d4', '#a8c4e0', '#d8e4ec']);
  vgrad(fb, 138, H, P.sea);
  for (let x = 196; x < W; x++) { const t = 136 - Math.round((x - 196) / 40); for (let y = t; y < 139; y++) fb.set(x, y, '#9a7a5a'); }
  for (let i = 0; i < 90; i++) { const x = Math.floor(R() * W), y = 142 + Math.floor(R() * 38); fb.rect(x, y, 2 + Math.floor((y - 138) / 12), 1, P.foam); }
  [[30, 150, 9], [80, 158, 12], [150, 148, 8], [210, 160, 13], [280, 150, 10], [120, 170, 11], [250, 174, 9]].forEach(([x, y, r]) => puff(fb, x, y, r, '#ffffff', '#c8d4e4'));
  [[40, 30, 6], [250, 24, 7], [290, 64, 5]].forEach(([x, y, r]) => puff(fb, x, y, r, '#ffffff', '#c8d4e4'));
  fb.blit(rapide(), 104, 48, 3);
  for (let y = 69; y < 87; y++) if (y % 2) fb.set(178, y, '#f4ecd8');
  [[70, 64], [60, 72], [76, 80]].forEach(([x, y]) => fb.rect(x, y, 18, 1, '#e4ecf4'));
  return { base: fb };
}

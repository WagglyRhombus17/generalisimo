// Tetuán aerodrome at night: Ju 52s loading troops under lanterns.
import { FB, vgrad, rng, dith } from '../engine/pixel.js';
import { VGA } from '../engine/palettes.js';
import { ju52, soldier, palm } from '../engine/sprites.js';

export function night() {
  const P = VGA, W = 320, H = 180, fb = new FB(W, H), R = rng(11);
  vgrad(fb, 0, 112, P.nsky);
  for (let i = 0; i < 90; i++) fb.set(Math.floor(R() * W), Math.floor(R() * 90), P.star);
  fb.disc(252, 30, 9, P.moon); fb.set(249, 27, P.moonD); fb.set(255, 32, P.moonD); fb.rect(250, 34, 2, 1, P.moonD);
  for (let x = 0; x < W; x++) {
    const t = Math.round(104 - 5 * Math.sin(x * 0.03) - 3 * Math.sin(x * 0.09 + 2));
    for (let y = t; y < 112; y++) fb.set(x, y, P.silhL);
  }
  vgrad(fb, 112, H, P.nground);
  const sil = { b: P.silh, d: P.silh, l: P.silh, g: P.silh };
  fb.blit(ju52(sil), 236, 26); fb.blit(ju52(sil), 196, 44);
  for (let x = 4; x < W; x += 12) { fb.set(x, 120, P.light); fb.set(x + 6, 150, P.light); fb.set(x + 7, 150, P.light); }
  for (let y = -16; y <= 16; y++) for (let x = -26; x <= 26; x++) {
    const d = Math.hypot(x, y * 1.6) / 26;
    if (d < 1 && dith(186 + x, 130 + y, (1 - d) * 0.55)) fb.set(186 + x, 130 + y, P.light);
  }
  fb.blit(ju52({ b: '#5a6070', d: '#2a2e38', l: P.light, g: P.light }), 140, 104, 3);
  const sp = Object.assign({}, P, { olive: P.silhL, oliveD: P.silh, skin: P.light, cap: P.silh, outline: P.silh });
  for (let i = 0; i < 9; i++) soldier(fb, 222 + i * 8, 140, sp, i);
  fb.rect(186, 128, 2, 3, P.light); fb.set(187, 127, P.star);
  palm(fb, 16, 140, P.silh); palm(fb, 300, 146, P.silh); palm(fb, 40, 132, P.silh);
  return { base: fb };
}

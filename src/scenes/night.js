// Tetuán aerodrome at night: Ju 52s loading troops under lanterns.
import { FB, vgrad, rng, dith, hash } from '../engine/pixel.js';
import { VGA } from '../engine/palettes.js';
import { ju52, soldier, palm } from '../engine/sprites.js';

const W = 320, H = 180;

export function night() {
  const P = VGA, fb = new FB(W, H), R = rng(11);
  vgrad(fb, 0, 104, P.nsky);
  const stars = Array.from({ length: 90 }, () => [Math.floor(R() * W), 20 + Math.floor(R() * 72)]);
  fb.disc(252, 40, 9, P.moon); fb.set(249, 37, P.moonD); fb.set(255, 42, P.moonD); fb.rect(250, 44, 2, 1, P.moonD);
  for (let x = 0; x < W; x++) {
    const t = Math.round(96 - 5 * Math.sin(x * 0.03) - 3 * Math.sin(x * 0.09 + 2));
    for (let y = t; y < 104; y++) fb.set(x, y, P.silhL);
  }
  vgrad(fb, 104, H, P.nground);
  for (let x = 4; x < W; x += 12) { fb.set(x, 110, P.light); fb.set(x + 6, 132, P.light); fb.set(x + 7, 132, P.light); }
  for (let y = -16; y <= 16; y++) for (let x = -26; x <= 26; x++) {
    const d = Math.hypot(x, y * 1.6) / 26;
    if (d < 1 && dith(186 + x, 118 + y, (1 - d) * 0.5)) fb.set(186 + x, 118 + y, P.light);
  }
  fb.blit(ju52({ b: '#5a6070', d: '#2a2e38', l: P.light, g: P.light }), 140, 92, 3);
  palm(fb, 16, 128, P.silh); palm(fb, 300, 132, P.silh); palm(fb, 40, 120, P.silh);
  const sil = ju52({ b: P.silh, d: P.silh, l: P.silh, g: P.silh });
  const sp = Object.assign({}, P, { olive: P.silhL, oliveD: P.silh, skin: P.light, cap: P.silh, outline: P.silh });

  return {
    base: fb,
    frame(f, t) {
      const tick = Math.floor(t * 3);
      stars.forEach(([x, y], i) => { if (hash(i, tick, 2) > 0.12) f.set(x, y, P.star); });
      f.blit(sil, Math.round(((236 + t * 7) % (W + 60)) - 30), 34);
      f.blit(sil, Math.round(((196 + t * 5) % (W + 60)) - 30), 54);
      // the queue shuffles toward the aircraft door
      const step = (t * 5) % 8;
      for (let i = 0; i < 8; i++) soldier(f, Math.round(214 + i * 10 - step * 1.25), 127, sp, i + Math.floor(t * 4));
      const lamp = Math.sin(t * 9) > -0.4 ? P.light : P.moonD;
      f.rect(186, 116, 2, 3, lamp); f.set(187, 115, lamp);
    }
  };
}

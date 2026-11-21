// Large 40x48 portrait busts for the generals board, council and vote.
// look: traits from data/generals.json (cap, must: 1 small / 2 large, beard, glasses, wide, hair, skin, old, medals, air).
// mood: 'happy' | 'neutral' | 'angry' changes the brows and mouth.
import { FB, vgrad, mix } from './pixel.js';

const SKIN = '#d9a27a', MOUTH = '#7a3a32', WHITE = '#f0ece4', INK = '#14181e';

export function bust(look = {}, mood = 'neutral', bg = ['#2a3a4a', '#101820']) {
  const fb = new FB(40, 48), cx = 20;
  const skin = look.skin || SKIN, skinD = mix(skin, '#5a2a1a', 0.35), skinL = mix(skin, '#ffffff', 0.25);
  const hair = look.hair || '#2a1a14';
  const civil = !!look.civil;
  const U = civil ? (look.shirt || '#4a4038') : (look.air ? '#3e4a5e' : '#5d6a32');
  const UL = mix(U, '#ffffff', 0.22), UD = mix(U, '#000000', 0.35);
  const gold = '#e0b850', goldD = '#a07a28';

  vgrad(fb, 0, 48, bg);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 40; x++) if (((x - 20) ** 2) / 400 + ((y - 20) ** 2) / 600 > 1 && (x + y) % 2) fb.set(x, y, bg[bg.length - 1]);

  // shoulders and uniform
  for (let y = 37; y < 48; y++) {
    const half = Math.min(19, 11 + Math.round((y - 37) * 0.9));
    fb.rect(cx - half, y, half * 2, 1, U);
    fb.rect(cx + half - 4, y, 4, 1, UD);
    fb.set(cx - half, y, UL);
  }
  for (let y = 37; y < 48; y++) { const o = Math.round((y - 37) * 0.45); fb.set(cx - 4 - o, y, UD); fb.set(cx + 3 + o, y, UD); }
  if (civil) {
    fb.rect(cx - 4, 35, 8, 3, '#e8e0d0'); fb.rect(cx - 1, 38, 2, 9, '#8a2a2a');
  } else {
    fb.rect(cx - 6, 34, 12, 4, UD); fb.rect(cx - 5, 34, 10, 1, U);
    fb.set(cx - 4, 36, gold); fb.set(cx - 3, 36, gold); fb.set(cx + 2, 36, gold); fb.set(cx + 3, 36, gold);
    fb.rect(cx - 17, 38, 6, 2, gold); fb.rect(cx + 11, 38, 6, 2, gold); fb.rect(cx - 17, 40, 6, 1, goldD); fb.rect(cx + 11, 40, 6, 1, goldD);
    for (let y = 40; y < 48; y += 3) { fb.set(cx - 1, y, gold); }
    if (look.medals) { fb.rect(cx - 13, 42, 3, 2, '#b03030'); fb.rect(cx - 10, 42, 3, 2, gold); fb.rect(cx - 7, 42, 2, 2, '#3050a0'); fb.rect(cx - 13, 44, 3, 1, gold); }
  }

  // neck
  fb.rect(cx - 4, 30, 8, 6, skinD); fb.rect(cx - 4, 30, 5, 5, skin);

  // head
  const W = look.wide ? 9.5 : 8.6;
  for (let y = 8; y < 34; y++) {
    const dy = (y - 20.5) / 12.8;
    let half = Math.sqrt(Math.max(0, 1 - dy * dy)) * W;
    if (y > 26) half *= 1 - (y - 26) * (look.wide ? 0.025 : 0.045);
    half = Math.round(half);
    if (half <= 0) continue;
    fb.rect(cx - half, y, half * 2, 1, skin);
    fb.rect(cx + half - 2, y, 2, 1, skinD);
    if (y > 13 && y < 27) fb.set(cx - half + 1, y, skinL);
  }
  const earX = Math.round(W) + 1;
  fb.rect(cx - earX, 19, 2, 5, skinD); fb.rect(cx + earX - 1, 19, 2, 5, skinD);
  if (look.old) { fb.rect(cx - 4, 14, 8, 1, skinD); fb.rect(cx - 3, 16, 6, 1, skinD); }

  // eyes
  fb.set(cx - 5, 20, WHITE); fb.set(cx - 4, 20, INK); fb.set(cx + 3, 20, INK); fb.set(cx + 4, 20, WHITE);
  fb.set(cx - 5, 21, skinD); fb.set(cx - 4, 21, skinD); fb.set(cx + 3, 21, skinD); fb.set(cx + 4, 21, skinD);
  // brows by mood
  const brow = look.beard ? '#e8e2d6' : hair;
  if (mood === 'angry') {
    [[-7, 17], [-6, 17], [-5, 18], [-4, 18], [3, 18], [4, 18], [5, 17], [6, 17]].forEach(([x, y]) => fb.set(cx + x, y, brow));
  } else if (mood === 'happy') {
    [[-7, 18], [-6, 17], [-5, 17], [-4, 18], [3, 18], [4, 17], [5, 17], [6, 18]].forEach(([x, y]) => fb.set(cx + x, y, brow));
  } else {
    fb.rect(cx - 7, 17, 4, 1, brow); fb.rect(cx + 3, 17, 4, 1, brow);
  }
  // nose
  for (let y = 21; y < 26; y++) fb.set(cx + 1, y, skinD);
  fb.set(cx - 1, 25, skinD); fb.set(cx + 2, 25, skinD); fb.set(cx, 25, skin);

  // mouth by mood
  if (mood === 'happy') { fb.set(cx - 4, 28, MOUTH); fb.rect(cx - 3, 29, 6, 1, MOUTH); fb.set(cx + 3, 28, MOUTH); }
  else if (mood === 'angry') { fb.set(cx - 4, 30, MOUTH); fb.rect(cx - 3, 29, 6, 1, MOUTH); fb.set(cx + 3, 30, MOUTH); }
  else fb.rect(cx - 3, 29, 6, 1, MOUTH);

  // facial hair
  if (look.beard) {
    const bc = '#e8e2d6', bd = '#bdb6a8';
    for (let y = 25; y < 40; y++) {
      const half = Math.round(Math.max(2, (look.wide ? 9 : 8) - Math.max(0, y - 29) * 0.6));
      fb.rect(cx - half, y, half * 2, 1, (y + 1) % 3 ? bc : bd);
    }
    fb.rect(cx - 3, 29, 6, 1, MOUTH);
  }
  if (look.must === 2) { fb.rect(cx - 5, 26, 10, 2, look.beard ? '#e8e2d6' : hair); fb.set(cx - 6, 27, hair); fb.set(cx + 5, 27, hair); }
  else if (look.must) fb.rect(cx - 2, 27, 4, 1, look.beard ? '#e8e2d6' : hair);

  // glasses
  if (look.glasses) {
    const rim = '#1a1a1a';
    [[cx - 7, 18], [cx + 2, 18]].forEach(([x, y]) => {
      fb.rect(x, y, 5, 1, rim); fb.rect(x, y + 4, 5, 1, rim); fb.rect(x, y + 1, 1, 3, rim); fb.rect(x + 4, y + 1, 1, 3, rim);
      fb.set(x + 1, y + 1, '#cfe6f2');
    });
    fb.rect(cx - 2, 19, 4, 1, rim);
  }

  // headgear or hair
  if (look.cap) {
    const capC = look.air ? '#2e3a50' : '#4a5624', capL = mix(capC, '#ffffff', 0.25);
    for (let y = 2; y < 10; y++) { const half = Math.round(10 + (9 - y) * 0.35); fb.rect(cx - half, y, half * 2, 1, y === 2 ? capL : capC); }
    fb.rect(cx - 10, 10, 20, 3, gold);
    for (let x = cx - 10; x < cx + 10; x += 2) fb.set(x, 11, goldD);
    fb.rect(cx - 1, 4, 3, 3, gold); fb.set(cx, 3, gold); fb.set(cx, 5, goldD);
    fb.rect(cx - 10, 13, 21, 2, INK); fb.rect(cx - 6, 13, 4, 1, '#3a4048');
    fb.set(cx - 9, 15, hair); fb.set(cx + 8, 15, hair);
  } else if (look.beret) {
    fb.rect(cx - 9, 7, 18, 4, '#2a2a2e'); fb.rect(cx - 10, 9, 20, 2, '#2a2a2e'); fb.set(cx, 6, '#2a2a2e');
  } else if (look.bald) {
    fb.rect(cx - 9, 16, 2, 6, hair); fb.rect(cx + 7, 16, 2, 6, hair);
  } else {
    for (let y = 6; y < 14; y++) { const half = Math.round(9 - Math.max(0, 9 - y) * 0.9); fb.rect(cx - half, y, half * 2, 1, hair); }
    fb.rect(cx - 9, 14, 2, 5, hair); fb.rect(cx + 7, 14, 2, 5, hair);
    fb.rect(cx - 2, 7, 1, 4, mix(hair, '#000000', 0.3));
    if (look.long) { fb.rect(cx - 11, 12, 3, 18, hair); fb.rect(cx + 8, 12, 3, 18, hair); }
  }
  return fb;
}

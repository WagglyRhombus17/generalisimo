// Mini-game: load the Ju 52 before dawn.
// Cargo arrives on a conveyor, each item with a few seconds before it is left on the tarmac.
// Pieces come in different shapes (rotate with R), the plane has a weight limit, and each flight
// has a different balance target. A bad load can crash on take-off.
import { FB, vgrad, dith } from '../engine/pixel.js';
import { HOLD } from '../engine/palettes.js';
import { rand, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { renderHUD } from '../screens/hud.js';
import { sfx, overrideMusic } from '../audio/audio.js';

const COLS = 10, ROWS = 3, CX = 65, CY = 61, CW = 18, CH = 16;
const ITEMS = {
  S: { n: 'Legionnaires', w: 80, s: [1, 1], men: 70 },
  C: { n: 'Ammo crate', w: 140, s: [1, 1], ammo: 4 },
  M: { n: 'MG team', w: 190, s: [2, 1], men: 60, morale: 1 },
  U: { n: 'Mule', w: 320, s: [2, 2], ammo: 3, morale: 1 },
  G: { n: 'Mountain gun', w: 420, s: [3, 1], ammo: 6, morale: 3 }
};
const TRIM = [
  { c: -1, why: 'The rear fuel tank is full. Load toward the nose.' },
  { c: -0.5, why: 'A tail wind is forecast. Keep the load a little forward.' },
  { c: 0, why: 'Normal trim. Keep the load centred.' },
  { c: 0.5, why: 'A radio set is bolted into the nose. Keep the load a little back.' },
  { c: 1, why: 'The nose tank is full. Load toward the tail.' }
];
const ITEM_TIME = [7, 5.5, 4.5], ROUND_TIME = 50, GREEN = 0.45, AMBER = 0.9;
let BASE = null;

function holdBase(P) {
  const W = 320, H = 180, fb = new FB(W, H);
  vgrad(fb, 0, 142, P.hang); vgrad(fb, 142, H, [P.floor, P.floorL]);
  for (let x = 6; x < W; x += 40) fb.rect(x, 0, 3, 142, P.hang[0]);
  for (let x = 30; x < 300; x++) for (let y = 146; y < 154; y++) if (dith(x, y, 0.5)) fb.set(x, y, P.hang[0]);
  const top = x => (x < 250 ? 50 : Math.round(50 + (x - 250) / 52 * 26));
  const bot = x => (x < 250 ? 118 : Math.round(118 - (x - 250) / 52 * 26));
  for (let x = 34; x <= 302; x++) {
    const t = top(x), b = bot(x);
    fb.rect(x, t, 1, b - t, P.plane);
    for (let y = t + 1; y < t + 5; y++) if (x % 2 === 0) fb.set(x, y, P.planeL);
    for (let y = b - 4; y < b; y++) if (x % 2 === 0) fb.set(x, y, P.planeD);
    fb.set(x, t, P.outline); fb.set(x, b, P.outline);
  }
  for (let x = 282; x <= 304; x++) {
    const t = x < 292 ? Math.round(76 - (x - 282) * 4.8) : Math.round(28 + (x - 292) * 0.4);
    for (let y = t; y < 78; y++) fb.set(x, y, x % 2 ? P.plane : P.planeL);
    fb.set(x, t, P.outline);
  }
  fb.rect(262, 84, 44, 3, P.planeD);
  fb.rect(16, 62, 20, 46, P.outline); fb.rect(18, 64, 16, 42, P.planeD);
  for (let y = 66; y < 104; y += 3) fb.rect(19, y, 14, 1, P.plane);
  fb.disc(14, 85, 3, P.metal);
  for (let i = 0; i < 3; i++) { fb.rect(39 + i * 8, 58, 7, 8, P.outline); fb.rect(40 + i * 8, 59, 5, 6, P.glass); }
  fb.rect(62, 58, 186, 54, P.outline); fb.rect(64, 60, 182, 50, P.interior);
  fb.rect(98, 118, 112, 6, P.planeD); fb.rect(98, 118, 112, 1, P.planeL);
  fb.rect(136, 124, 24, 10, P.outline); fb.rect(137, 125, 22, 8, P.plane);
  fb.rect(170, 124, 2, 14, P.outline); fb.rect(165, 134, 12, 8, P.planeD); fb.disc(171, 144, 4, P.outline);
  fb.rect(288, 104, 2, 8, P.outline); fb.disc(289, 113, 2, P.outline);
  // the nose (left) and tail (right) labels painted on the floor of the hold
  fb.rect(66, 112, 3, 1, P.pick); fb.rect(241, 112, 3, 1, P.pick);
  return fb;
}

function soldierAt(fb, x, y, P) {
  fb.rect(x + 7, y + 2, 5, 2, P.oliveD); fb.disc(x + 9, y + 5, 2, P.skin);
  fb.rect(x + 6, y + 8, 7, 6, P.olive); fb.rect(x + 12, y + 11, 3, 3, P.oliveD); fb.line(x + 4, y + 3, x + 4, y + 13, P.outline);
}

// Draw a placed piece filling its rectangle (in pixels).
function drawPiece(fb, k, x, y, w, h, P) {
  fb.rect(x + 1, y + 1, w - 1, h - 1, '#262c34');
  if (k === 'S') soldierAt(fb, x, y, P);
  else if (k === 'C') {
    fb.rect(x + 3, y + 3, 12, 11, P.crateD); fb.rect(x + 4, y + 4, 10, 9, P.crate);
    fb.line(x + 4, y + 4, x + 13, y + 12, P.crateD); fb.line(x + 13, y + 4, x + 4, y + 12, P.crateD);
  } else if (k === 'M') {
    soldierAt(fb, x, y, P);
    const gx = w > h ? x + 18 : x, gy = w > h ? y : y + 16;
    fb.rect(gx + 2, gy + 6, 14, 2, P.metal); fb.rect(gx + 4, gy + 5, 5, 4, P.metal); fb.set(gx + 16, gy + 6, P.outline);
    fb.line(gx + 6, gy + 9, gx + 3, gy + 14, P.metal); fb.line(gx + 7, gy + 9, gx + 10, gy + 14, P.metal);
  } else if (k === 'U') {
    fb.rect(x + 6, y + 12, 20, 9, P.mule); fb.rect(x + 6, y + 12, 20, 2, '#a07448');
    fb.rect(x + 24, y + 5, 6, 10, P.mule); fb.rect(x + 28, y + 9, 4, 4, P.muleD);
    fb.set(x + 25, y + 3, P.muleD); fb.set(x + 25, y + 4, P.muleD); fb.set(x + 28, y + 3, P.muleD); fb.set(x + 28, y + 4, P.muleD);
    [8, 11, 21, 24].forEach(lx => fb.rect(x + lx, y + 21, 2, 8, P.muleD));
    fb.line(x + 6, y + 13, x + 3, y + 20, P.muleD);
    fb.rect(x + 12, y + 9, 8, 4, P.crateD);
  } else if (k === 'G') {
    if (w > h) {
      fb.rect(x + 10, y + 6, 36, 3, P.metal); fb.rect(x + 42, y + 5, 4, 5, P.outline);
      fb.rect(x + 20, y + 2, 5, 12, '#5a646e'); fb.disc(x + 23, y + 10, 4, P.outline); fb.disc(x + 23, y + 10, 2, P.metal);
      fb.line(x + 20, y + 11, x + 4, y + 14, P.outline);
    } else {
      fb.rect(x + 8, y + 4, 3, 36, P.metal); fb.rect(x + 7, y + 2, 5, 4, P.outline);
      fb.rect(x + 3, y + 18, 12, 5, '#5a646e'); fb.disc(x + 9, y + 30, 4, P.outline); fb.disc(x + 9, y + 30, 2, P.metal);
      fb.line(x + 9, y + 32, x + 11, y + 46, P.outline);
    }
  }
}

export function airlift(S, ctx) {
  return new Promise(resolve => {
    if (!BASE) BASE = holdBase(HOLD);
    let rounds = S.ger >= 60 ? 3 : S.ger >= 30 ? 2 : 1;
    if (S.flags.fuelShort) rounds = Math.max(1, rounds - 1);
    const max = S.ger >= 30 ? 2500 : 1600;
    let round = 0, pieces = [], grid = [], queue = [], qi = 0, rot = false, hover = -1, busy = true, total = 0;
    let timed = true, itemLeft = 0, dawnLeft = 0, trim = TRIM[2], tick = 0;

    const ov = document.getElementById('ov-air');
    ov.hidden = false;
    overrideMusic('airlift');
    ov.innerHTML = `<canvas class="air-cv" aria-label="Cargo hold of the Ju 52"></canvas>
      <div class="pnl air-top"><span class="t">AIRLIFT · TETUÁN ▶ SEVILLA</span>
        <span class="m"><b>FLIGHT</b> <span data-f="round"></span></span>
        <span class="m"><b>LOAD</b> <span data-f="load"></span></span>
        <span class="m"><b>DAWN</b> <span data-f="dawn"></span></span>
        <span class="m"><b>BALANCE</b> <span data-f="bal"></span></span>
        <span class="balbar"><span class="zone amber" data-f="amber"></span><span class="zone green" data-f="green"></span><i data-f="mark"></i></span>
        <span class="help" data-f="trim"></span></div>
      <div class="pnl air-bot"><b>NEXT</b><span class="q" data-f="queue"></span>
        <button type="button" data-f="rot" data-key="r">ROTATE [R]</button>
        <button type="button" data-f="skip" data-key="s">LEAVE IT [S]</button>
        <button type="button" class="primary" data-f="go" data-key="enter">TAKE OFF ▶</button></div>
      <div class="pnl air-msg" data-f="msg" hidden></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const cv = ov.querySelector('.air-cv');

    const shape = () => { const it = ITEMS[queue[qi]]; if (!it) return [1, 1]; return rot ? [it.s[1], it.s[0]] : it.s; };
    const fits = (i, [w, h]) => {
      const c = i % COLS, r = Math.floor(i / COLS);
      if (c + w > COLS || r + h > ROWS) return false;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (grid[(r + y) * COLS + c + x] != null) return false;
      return true;
    };

    const stats = () => {
      let load = 0, mom = 0;
      pieces.forEach(p => {
        const it = ITEMS[p.k], n = p.w * p.h, per = it.w / n;
        load += it.w;
        for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) mom += per * (p.c + x - 4.5);
      });
      return { load, cg: load ? mom / load : 0 };
    };

    const draw = () => {
      const P = HOLD, f = BASE.copy();
      for (let i = 0; i < COLS * ROWS; i++) {
        const x = CX + (i % COLS) * CW, y = CY + Math.floor(i / COLS) * CH;
        for (let k = 0; k < 18; k += 2) { f.set(x + k, y, P.cell); f.set(x + k, y + 15, P.cell); }
        for (let k = 0; k < 16; k += 2) { f.set(x, y + k, P.cell); f.set(x + 17, y + k, P.cell); }
      }
      pieces.forEach(p => drawPiece(f, p.k, CX + p.c * CW, CY + p.r * CH, p.w * CW, p.h * CH, P));
      if (!busy && hover >= 0 && qi < queue.length) {
        const [w, h] = shape(), ok = fits(hover, [w, h]), col = ok ? '#8fd18f' : '#ff6a5a';
        const x = CX + (hover % COLS) * CW, y = CY + Math.floor(hover / COLS) * CH;
        const pw = Math.min(w, COLS - hover % COLS) * CW, ph = Math.min(h, ROWS - Math.floor(hover / COLS)) * CH;
        for (let k = 0; k <= pw; k++) { f.set(x + k, y, col); f.set(x + k, y + ph, col); }
        for (let k = 0; k <= ph; k++) { f.set(x, y + k, col); f.set(x + pw, y + k, col); }
      }
      f.to(cv);
    };

    const fmtT = s => `0:${String(Math.max(0, Math.ceil(s))).padStart(2, '0')}`;
    const update = () => {
      const { load, cg } = stats();
      ov.dataset.qi = String(qi);
      $f('round').textContent = `${round + 1} / ${rounds}`;
      const lo = $f('load'); lo.textContent = `${load.toLocaleString('en-US')} / ${max.toLocaleString('en-US')} kg`; lo.className = load > max ? 'warn' : '';
      const dn = $f('dawn'); dn.textContent = timed ? fmtT(dawnLeft) : 'NO TIMER'; dn.className = timed && dawnLeft < 10 ? 'warn' : '';
      const off = Math.abs(cg - trim.c), b = $f('bal');
      b.textContent = !load ? 'EMPTY' : off <= GREEN ? 'GOOD' : `${off <= AMBER ? 'POOR' : 'DANGEROUS'} · ${cg < trim.c ? 'NOSE' : 'TAIL'}-HEAVY`;
      b.className = !load || off <= GREEN ? 'ok' : off <= AMBER ? 'mid' : 'warn';
      const pos = v => Math.max(0, Math.min(100, 50 + v / 4.5 * 50));
      $f('mark').style.left = `${pos(cg)}%`;
      $f('green').style.left = `${pos(trim.c - GREEN)}%`; $f('green').style.width = `${pos(trim.c + GREEN) - pos(trim.c - GREEN)}%`;
      $f('amber').style.left = `${pos(trim.c - AMBER)}%`; $f('amber').style.width = `${pos(trim.c + AMBER) - pos(trim.c - AMBER)}%`;
      $f('trim').textContent = `${trim.why} Click the hold to place the next item. R rotates it.`;
      const q = $f('queue'); q.replaceChildren();
      queue.slice(qi, qi + 4).forEach((k, j) => {
        const it = ITEMS[k], s = document.createElement('span');
        const [w, h] = j === 0 && rot ? [it.s[1], it.s[0]] : it.s;
        s.className = j === 0 ? 'next' : '';
        s.textContent = `${it.n} · ${it.w} kg · ${w}×${h}`;
        if (j === 0 && timed) { const t = document.createElement('i'); t.className = 'fuse'; t.style.width = `${Math.max(0, itemLeft / ITEM_TIME[round] * 100)}%`; s.append(t); }
        q.append(s);
      });
      if (qi >= queue.length) { const s = document.createElement('span'); s.textContent = 'Nothing left on the tarmac'; q.append(s); }
      $f('skip').disabled = busy || qi >= queue.length;
      $f('rot').disabled = busy || qi >= queue.length || ITEMS[queue[qi]].s[0] === ITEMS[queue[qi]].s[1];
      $f('go').disabled = busy || !pieces.length;
      draw();
    };

    const advance = () => { qi++; rot = false; itemLeft = ITEM_TIME[round]; };

    const message = (title, text, chipList, btns) => {
      const m = $f('msg'); m.hidden = false; m.replaceChildren();
      const h = document.createElement('h3'); h.textContent = title;
      const p = document.createElement('p'); p.textContent = text;
      m.append(h, p);
      if (chipList && chipList.length) { const row = document.createElement('div'); row.className = 'chips'; chipList.forEach(c => { const s = document.createElement('span'); s.className = `chip ${c.c}`; s.textContent = c.t; row.append(s); }); m.append(row); }
      const row = document.createElement('div'); row.className = 'msg-btns';
      btns.forEach(([label, key, fn], i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = i === 0 ? 'primary' : ''; if (key) b.dataset.key = key; b.textContent = label;
        b.addEventListener('click', () => { m.hidden = true; fn(); }, { once: true });
        row.append(b);
      });
      m.append(row); row.querySelector('button').focus({ preventScroll: true });
    };

    const stopClock = () => { clearInterval(tick); tick = 0; };
    const startClock = () => {
      stopClock();
      if (!timed) return;
      let last = performance.now();
      tick = setInterval(() => {
        if (busy) return;
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        dawnLeft -= dt;
        if (qi < queue.length) { itemLeft -= dt; if (itemLeft <= 0) { advance(); sfx('paper'); } }
        if (dawnLeft <= 0) { takeoff(true); return; }
        update();
      }, 100);
    };

    const newRound = () => {
      pieces = []; grid = Array(COLS * ROWS).fill(null);
      const bag = ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'C', 'C', 'C', 'M', 'M', 'M', 'U', 'U', 'G', 'G'];
      queue = Array.from({ length: 22 }, () => bag[Math.floor(rand(S) * bag.length)]);
      trim = TRIM[Math.floor(rand(S) * TRIM.length)];
      qi = 0; rot = false; busy = false; itemLeft = ITEM_TIME[round]; dawnLeft = ROUND_TIME;
      update(); startClock();
    };

    function takeoff(dawn) {
      if (busy) return;
      busy = true; stopClock(); update();
      const { load, cg } = stats(), before = snapshot(S), off = Math.abs(cg - trim.c);
      const n = { men: 0, ammo: 0, morale: 0 };
      pieces.forEach(p => { const it = ITEMS[p.k]; n.men += it.men || 0; n.ammo += it.ammo || 0; n.morale += it.morale || 0; });
      const risk = !load ? 0 : 0.03 + (load > max ? 0.5 : 0) + (off > AMBER ? 0.4 : off > GREEN ? 0.12 : 0);
      let title, text;
      if (load) sfx('takeoff');
      if (!load) {
        title = 'The plane leaves empty';
        text = 'Dawn comes before anything is loaded. The Junkers has to go before Republican fighters are up.';
      } else if (rand(S) < risk) {
        setTimeout(() => sfx('boom'), 700);
        applyFx(S, { ger: -8, morale: -5 });
        S.tA = Math.max(0, S.tA - Math.round(n.men / 5));
        title = 'A Junkers goes down';
        text = load > max ? 'Overloaded, the aircraft fails to climb off the Tetuán strip and crashes at the end of the runway. Berlin wants to know why.' : 'Badly balanced, the aircraft stalls on take-off and crashes. The flight is lost and Berlin wants to know why.';
      } else {
        applyFx(S, { ship: n.men, ammo: n.ammo, morale: n.morale });
        total += n.men;
        title = dawn ? 'Dawn: the flight gets away' : 'The flight gets through';
        text = `For several days the Junkers shuttle back and forth with loads like this one. ${n.men.toLocaleString('en-US')} men reach Sevilla, with the guns and supplies you loaded.`;
      }
      renderHUD(S, ctx.D);
      round++;
      const last = round >= rounds;
      message(title, text, chips(before, snapshot(S), S, ctx.D), [[last ? 'CONTINUE ▶' : 'NEXT FLIGHT ▶', 'enter', () => {
        if (!last) { newRound(); return; }
        S.flags.pipe = 1;
        S.ledger.push({ k: 'The airlift', you: `Your Junkers carried ${total.toLocaleString('en-US')} men in ${rounds} flight${rounds > 1 ? 's' : ''}.`, hist: 'German Ju 52s flew about 14,000 men across the Strait between late July and October 1936, the first large military airlift in history.' });
        ov.hidden = true;
        overrideMusic(null);
        resolve();
      }]]);
    }

    const cellAt = e => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 320, y = (e.clientY - r.top) / r.height * 180;
      const c = Math.floor((x - CX) / CW), rr = Math.floor((y - CY) / CH);
      return c < 0 || c >= COLS || rr < 0 || rr >= ROWS ? -1 : rr * COLS + c;
    };
    cv.addEventListener('mousemove', e => { const h = cellAt(e); if (h !== hover) { hover = h; if (!busy) draw(); } });
    cv.addEventListener('mouseleave', () => { hover = -1; if (!busy) draw(); });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); if (!busy) { rot = !rot; update(); } });
    cv.addEventListener('click', e => {
      if (busy || qi >= queue.length) return;
      const i = cellAt(e);
      hover = i;
      const [w, h] = shape();
      if (i < 0 || !fits(i, [w, h])) { draw(); return; }
      const p = { k: queue[qi], c: i % COLS, r: Math.floor(i / COLS), w, h };
      pieces.push(p);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) grid[(p.r + y) * COLS + p.c + x] = pieces.length - 1;
      sfx('place');
      advance(); update();
    });
    $f('rot').addEventListener('click', () => { if (!busy) { rot = !rot; update(); } });
    $f('skip').addEventListener('click', () => { if (!busy && qi < queue.length) { advance(); update(); } });
    $f('go').addEventListener('click', () => { if (!busy && pieces.length) takeoff(false); });

    pieces = []; grid = Array(COLS * ROWS).fill(null); update();
    const intro = (S.ger >= 30
      ? `German Ju 52s are waiting at Tetuán. You have ${rounds} flight${rounds > 1 ? 's' : ''} before the convoy sails.`
      : 'Without German help you have only a few old aircraft, so loads are limited and you get one flight.') +
      ` Cargo comes off the lorries one piece at a time, and each piece waits only a few seconds. Fit what you can into the hold before dawn. Stay under ${max.toLocaleString('en-US')} kg and keep the balance marker in the green zone, which moves from flight to flight.`;
    message('Load the Junkers', intro, null, [
      ['BEGIN ▶', 'enter', () => { timed = true; newRound(); }],
      ['PLAY WITHOUT TIMER', 'n', () => { timed = false; newRound(); }]
    ]);
  });
}

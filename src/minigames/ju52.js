// Mini-game: load the Ju 52. Each round stands for several days of flights across the Strait.
import { FB, vgrad, dith } from '../engine/pixel.js';
import { HOLD } from '../engine/palettes.js';
import { rand, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { renderHUD } from '../screens/hud.js';

const COLS = 10, ROWS = 3, CX = 65, CY = 61, CW = 18, CH = 16;
const ITEMS = { S: { n: 'Legionnaire', w: 80 }, C: { n: 'Ammo crate', w: 120 }, M: { n: 'MG team', w: 190 }, U: { n: 'Mule', w: 300 } };
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
  for (let y = 36; y < 136; y++) for (let x = 8; x < 14; x++) if (dith(x, y, 0.3)) fb.set(x, y, P.prop);
  fb.disc(14, 85, 3, P.metal);
  for (let i = 0; i < 3; i++) { fb.rect(39 + i * 8, 58, 7, 8, P.outline); fb.rect(40 + i * 8, 59, 5, 6, P.glass); }
  fb.rect(62, 58, 186, 54, P.outline); fb.rect(64, 60, 182, 50, P.interior);
  fb.rect(98, 118, 112, 6, P.planeD); fb.rect(98, 118, 112, 1, P.planeL);
  fb.rect(136, 124, 24, 10, P.outline); fb.rect(137, 125, 22, 8, P.plane);
  for (let y = 112; y < 146; y++) for (let x = 131; x < 135; x++) if (dith(x, y, 0.3)) fb.set(x, y, P.prop);
  fb.rect(170, 124, 2, 14, P.outline); fb.rect(165, 134, 12, 8, P.planeD); fb.disc(171, 144, 4, P.outline);
  fb.rect(288, 104, 2, 8, P.outline); fb.disc(289, 113, 2, P.outline);
  return fb;
}

function drawItem(fb, k, x, y, P) {
  if (k === 'S') {
    fb.rect(x + 7, y + 2, 5, 2, P.oliveD); fb.disc(x + 9, y + 5, 2, P.skin);
    fb.rect(x + 6, y + 8, 7, 6, P.olive); fb.rect(x + 12, y + 11, 3, 3, P.oliveD); fb.line(x + 4, y + 3, x + 4, y + 13, P.outline);
  } else if (k === 'C') {
    fb.rect(x + 3, y + 4, 12, 10, P.crateD); fb.rect(x + 4, y + 5, 10, 8, P.crate);
    fb.line(x + 4, y + 5, x + 13, y + 12, P.crateD); fb.line(x + 13, y + 5, x + 4, y + 12, P.crateD);
  } else if (k === 'M') {
    fb.rect(x + 3, y + 6, 13, 2, P.metal); fb.rect(x + 5, y + 5, 5, 4, P.metal);
    fb.line(x + 7, y + 9, x + 4, y + 14, P.metal); fb.line(x + 8, y + 9, x + 11, y + 14, P.metal);
  } else if (k === 'U') {
    fb.rect(x + 3, y + 6, 10, 5, P.mule); fb.rect(x + 12, y + 3, 3, 5, P.mule); fb.set(x + 13, y + 2, P.muleD); fb.set(x + 15, y + 5, P.muleD);
    [4, 6, 10, 12].forEach(lx => fb.rect(x + lx, y + 11, 1, 3, P.muleD)); fb.set(x + 2, y + 7, P.muleD);
  }
}

function draw(cv, cells, hover) {
  const P = HOLD, f = BASE.copy();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, x = CX + c * CW, y = CY + r * CH;
    const col = hover === i && !cells[i] ? P.pick : P.cell;
    for (let k = 0; k < 18; k++) if (k % 2 === 0 || hover === i) { f.set(x + k, y, col); f.set(x + k, y + 15, col); }
    for (let k = 0; k < 16; k++) if (k % 2 === 0 || hover === i) { f.set(x, y + k, col); f.set(x + 17, y + k, col); }
    if (cells[i]) drawItem(f, cells[i], x, y, P);
  }
  f.to(cv);
}

export function airlift(S, ctx) {
  return new Promise(resolve => {
    if (!BASE) BASE = holdBase(HOLD);
    let rounds = S.ger >= 60 ? 3 : S.ger >= 30 ? 2 : 1;
    if (S.flags.fuelShort) rounds = Math.max(1, rounds - 1);
    const max = S.ger >= 30 ? 2500 : 1600;
    let round = 0, cells = [], queue = [], qi = 0, hover = -1, busy = true, total = 0;

    const ov = document.getElementById('ov-air');
    ov.hidden = false;
    ov.innerHTML = `<canvas class="air-cv" aria-label="Cargo hold of the Ju 52"></canvas>
      <div class="pnl air-top"><span class="t">AIRLIFT · TETUÁN ▶ SEVILLA</span>
        <span class="m"><b>ROUND</b> <span data-f="round"></span></span>
        <span class="m"><b>LOAD</b> <span data-f="load"></span></span>
        <span class="m"><b>BALANCE</b> <span data-f="bal"></span></span>
        <span class="balbar"><i data-f="mark"></i></span>
        <span class="help">Click a square in the hold to load the next item. The nose is on the left.</span></div>
      <div class="pnl air-bot"><b>NEXT</b><span class="q" data-f="queue"></span>
        <button type="button" data-f="skip" data-key="s">LEAVE IT [S]</button>
        <button type="button" class="primary" data-f="go" data-key="enter">TAKE OFF ▶</button></div>
      <div class="pnl air-msg" data-f="msg" hidden></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const cv = ov.querySelector('.air-cv');

    const stats = () => {
      let load = 0, mom = 0; const n = { S: 0, C: 0, M: 0, U: 0 };
      cells.forEach((k, i) => { if (!k) return; const w = ITEMS[k].w; load += w; mom += w * ((i % COLS) - 4.5); n[k]++; });
      return { load, cg: load ? mom / load : 0, n };
    };

    const update = () => {
      const { load, cg } = stats();
      $f('round').textContent = `${round + 1} / ${rounds}`;
      const lo = $f('load'); lo.textContent = `${load.toLocaleString('en-US')} / ${max.toLocaleString('en-US')} kg`; lo.className = load > max ? 'warn' : '';
      const a = Math.abs(cg), b = $f('bal');
      b.textContent = a <= 0.8 ? 'GOOD' : `${a <= 1.5 ? 'POOR' : 'DANGEROUS'} · ${cg < 0 ? 'NOSE' : 'TAIL'}-HEAVY`;
      b.className = a <= 0.8 ? 'ok' : a <= 1.5 ? 'mid' : 'warn';
      $f('mark').style.left = `${Math.max(0, Math.min(100, 50 + cg / 4.5 * 50))}%`;
      const q = $f('queue'); q.replaceChildren();
      queue.slice(qi, qi + 4).forEach((k, j) => {
        const s = document.createElement('span'); s.className = j === 0 ? 'next' : ''; s.textContent = `${ITEMS[k].n} · ${ITEMS[k].w} kg`; q.append(s);
      });
      if (qi >= queue.length) { const s = document.createElement('span'); s.textContent = 'Nothing left on the tarmac'; q.append(s); }
      $f('skip').disabled = busy || qi >= queue.length;
      $f('go').disabled = busy || !cells.some(Boolean);
      draw(cv, cells, busy ? -1 : hover);
    };

    const message = (title, text, chipList, btn, onGo) => {
      const m = $f('msg'); m.hidden = false; m.replaceChildren();
      const h = document.createElement('h3'); h.textContent = title;
      const p = document.createElement('p'); p.textContent = text;
      m.append(h, p);
      if (chipList && chipList.length) { const row = document.createElement('div'); row.className = 'chips'; chipList.forEach(c => { const s = document.createElement('span'); s.className = `chip ${c.c}`; s.textContent = c.t; row.append(s); }); m.append(row); }
      const b = document.createElement('button'); b.type = 'button'; b.className = 'primary'; b.dataset.key = 'enter'; b.textContent = btn;
      b.addEventListener('click', () => { m.hidden = true; onGo(); }, { once: true });
      m.append(b); b.focus({ preventScroll: true });
    };

    const newRound = () => {
      cells = Array(COLS * ROWS).fill(null);
      queue = Array.from({ length: 20 }, () => { const x = rand(S); return x < 0.55 ? 'S' : x < 0.75 ? 'C' : x < 0.9 ? 'M' : 'U'; });
      qi = 0; busy = false; update();
    };

    const takeoff = () => {
      busy = true; update();
      const { load, cg, n } = stats(), before = snapshot(S);
      const risk = 0.03 + (load > max ? 0.45 : 0) + (Math.abs(cg) > 1.5 ? 0.35 : Math.abs(cg) > 0.8 ? 0.12 : 0);
      let title, text;
      if (rand(S) < risk) {
        applyFx(S, { ger: -8, morale: -5 });
        S.tA = Math.max(0, S.tA - n.S * 15);
        title = 'A Junkers goes down';
        text = load > max ? 'Overloaded, one aircraft fails to climb off the Tetuán strip and crashes at the end of the runway. Berlin wants to know why.' : 'Badly balanced, one aircraft stalls on take-off and crashes. The round is lost and Berlin wants to know why.';
      } else {
        const menN = n.S * 70 + n.M * 60;
        applyFx(S, { ship: menN, ammo: n.C * 4 + n.U * 2, morale: n.M + n.U });
        total += menN;
        title = 'The flights get through';
        text = `For several days the Junkers shuttle back and forth across the Strait. ${menN.toLocaleString('en-US')} men reach Sevilla, with the guns and supplies you loaded.`;
      }
      renderHUD(S, ctx.D);
      round++;
      const last = round >= rounds;
      message(title, text, chips(before, snapshot(S), S, ctx.D), last ? 'CONTINUE ▶' : 'NEXT ROUND ▶', () => {
        if (!last) { newRound(); return; }
        S.flags.pipe = 1;
        S.ledger.push({ k: 'The airlift', you: `Your Junkers carried ${total.toLocaleString('en-US')} men in ${rounds} round${rounds > 1 ? 's' : ''}.`, hist: 'German Ju 52s flew about 14,000 men across the Strait between late July and October 1936, the first large military airlift in history.' });
        ov.hidden = true;
        resolve();
      });
    };

    const cellAt = e => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 320, y = (e.clientY - r.top) / r.height * 180;
      const c = Math.floor((x - CX) / CW), rr = Math.floor((y - CY) / CH);
      return c < 0 || c >= COLS || rr < 0 || rr >= ROWS ? -1 : rr * COLS + c;
    };
    cv.addEventListener('mousemove', e => { const h = cellAt(e); if (h !== hover) { hover = h; if (!busy) draw(cv, cells, hover); } });
    cv.addEventListener('mouseleave', () => { hover = -1; if (!busy) draw(cv, cells, -1); });
    cv.addEventListener('click', e => {
      if (busy || qi >= queue.length) return;
      const i = cellAt(e);
      if (i < 0 || cells[i]) return;
      cells[i] = queue[qi++]; update();
    });
    $f('skip').addEventListener('click', () => { if (!busy && qi < queue.length) { qi++; update(); } });
    $f('go').addEventListener('click', () => { if (!busy && cells.some(Boolean)) takeoff(); });

    cells = Array(COLS * ROWS).fill(null); update();
    const intro = S.ger >= 30
      ? `German Ju 52s are waiting at Tetuán. You have ${rounds} round${rounds > 1 ? 's' : ''} of flights before the convoy sails. Keep each load under ${max.toLocaleString('en-US')} kg and the balance near the middle, or a plane may crash.`
      : `Without German help you have only a few old aircraft, so loads are limited to ${max.toLocaleString('en-US')} kg and you get one round. Keep the balance near the middle.`;
    message('Load the Junkers', intro, null, 'BEGIN ▶', newRound);
  });
}

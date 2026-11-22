// Mini-game: the Iron Ring of Bilbao, June 1937.
// A defector has brought the plans of the ring. Study them for a few seconds, then break through
// using only your memory, two reconnaissance flights and a handful of artillery barrages.
// The plans are months old: one marked weak point has been rebuilt, and one new gap has opened.
import { FB, vgrad, dith, hash, noise } from '../engine/pixel.js';
import { rand, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { renderHUD } from '../screens/hud.js';
import { sfx, overrideMusic } from '../audio/audio.js';
import { motionOn } from '../settings.js';

const W = 320, H = 180, CX = 178, CY = 96, RX = 112, RY = 52;
const SEGS = 12, A0 = -1.25, A1 = 3.55; // the arc runs from north-east, round the south, to the west
const STUDY = 6;
let TERRAIN = null;

const segAngle = (i, f = 0.5) => A0 + (A1 - A0) * (i + f) / SEGS;
const at = (a, k = 1) => [Math.round(CX + RX * k * Math.cos(a)), Math.round(CY + RY * k * Math.sin(a))];
const estuaryX = y => Math.round(CX - 6 - (CY - y) * 1.25 + Math.sin(y / 9) * 3);

function terrain() {
  const fb = new FB(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = noise(x, y, 16, 11) * 0.65 + noise(x, y, 6, 12) * 0.35 + (dith(x, y, 0.5) ? 0.03 : 0);
    fb.set(x, y, h > 0.62 ? (dith(x, y, 0.5) ? '#3e5a2e' : '#34502a') : h > 0.35 ? (dith(x, y, 0.4) ? '#4e6c38' : '#46632f') : '#567640');
    if (hash(x, y, 13) < 0.03) fb.set(x, y, '#2c4222');
  }
  // the Bay of Biscay in the top-left corner and the estuary down to the city
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x + y * 1.4 < 70) fb.set(x, y, dith(x, y, 0.5) ? '#2f5d98' : '#24427e');
  for (let y = 18; y <= CY; y++) { const x = estuaryX(y); fb.rect(x - 2, y, 5, 1, '#3f7cb0'); fb.set(x - 2, y, '#24427e'); }
  // the city: blocks along both banks of the estuary
  for (let y = CY - 18; y < CY + 14; y += 5) for (let x = CX - 26; x < CX + 26; x += 6) {
    if (Math.hypot((x - CX) / 30, (y - CY) / 20) > 1 || Math.abs(x - estuaryX(y)) < 4) continue;
    fb.rect(x, y, 5, 4, hash(x, y, 3) < 0.5 ? '#c8bca4' : '#a89a80'); fb.rect(x, y + 3, 5, 1, '#6a604c');
  }
  // roads radiating from the city
  for (let k = 0; k < 6; k++) {
    const a = A0 + (A1 - A0) * (k + 0.5) / 6;
    for (let r = 0.35; r < 1.5; r += 0.01) { const [x, y] = at(a + Math.sin(r * 6) * 0.04, r); fb.set(x, y, '#8a7a5a'); }
  }
  return fb;
}

export function ironRing(S, ctx) {
  return new Promise(resolve => {
    if (!TERRAIN) TERRAIN = terrain();
    const before = snapshot(S), late = S.ch >= 6;
    // three gaps on the plans; one of them has since been rebuilt, and one new gap has opened
    const order = Array.from({ length: SEGS }, (_, i) => i);
    for (let i = SEGS - 1; i > 0; i--) { const j = Math.floor(rand(S) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const marked = order.slice(0, 3), fixed = marked[0], fresh = order[3];
    const weak = new Set([marked[1], marked[2], fresh]);
    const seg = Array.from({ length: SEGS }, (_, i) => ({ i, weak: weak.has(i), marked: marked.includes(i), known: null, hit: null }));
    let phase = 'intro', tool = 'barrage', recon = 2, shells = 4, breaches = 0, used = 0, lost = 0, studyLeft = STUDY, timer = 0, anim = 0, blasts = [], busy = false;

    const ov = document.getElementById('ov-iron');
    ov.hidden = false;
    overrideMusic('ironring');
    ov.innerHTML = `<canvas class="mg-cv" aria-label="Map of Bilbao and its ring of fortifications"></canvas><div class="mg-hots"></div>
      <div class="pnl mg-top"><span class="t">THE IRON RING · BILBAO</span>
        <span class="m"><b>BREACHES</b> <span data-f="br"></span></span>
        <span class="m"><b>BARRAGES</b> <span data-f="sh"></span></span>
        <span class="m"><b>RECON FLIGHTS</b> <span data-f="rc"></span></span>
        <span class="help" data-f="help"></span></div>
      <div class="pnl mg-bot"><button type="button" data-f="t-barrage" data-key="1">1 BARRAGE</button><button type="button" data-f="t-recon" data-key="2">2 RECON FLIGHT</button>
        <span class="note" data-f="note"></span><button type="button" class="primary" data-f="ready" data-key="enter" hidden>I HAVE IT MEMORISED ▶</button></div>
      <div class="pnl mg-msg" data-f="msg" hidden></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const cv = ov.querySelector('.mg-cv'), hots = ov.querySelector('.mg-hots');

    const draw = t => {
      const f = TERRAIN.copy();
      const plans = phase === 'study';
      if (plans) { // blueprint
        vgrad(f, 0, H, ['#16305a', '#1a3a6a']);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x % 16 === 0 || y % 16 === 0) f.set(x, y, '#2a4c80');
        for (let y = 18; y <= CY; y++) f.set(estuaryX(y) - 3, y, '#9ab8e0'), f.set(estuaryX(y) + 3, y, '#9ab8e0');
        for (let a = 0; a < 6.3; a += 0.02) { const x = CX + 30 * Math.cos(a), y = CY + 20 * Math.sin(a); f.set(x, y, '#9ab8e0'); }
      }
      // the ring itself, segment by segment
      seg.forEach(s => {
        const a0 = segAngle(s.i, 0.06), a1 = segAngle(s.i, 0.94);
        const gap = plans ? s.marked : s.hit === 'breach';
        for (let a = a0; a <= a1; a += 0.004) {
          const [x, y] = at(a);
          if (plans) {
            if (gap) { if (Math.floor(a * 120) % 3 === 0) { f.rect(x - 1, y - 1, 3, 3, '#ff5a4a'); } }
            else f.rect(x - 1, y - 1, 3, 3, '#e8f0ff');
          } else if (!gap) {
            f.rect(x - 1, y - 1, 3, 3, '#3a3a40'); f.set(x, y, s.hit === 'held' ? '#6a6a70' : '#9a9aa0');
          }
        }
        const [mx, my] = at(segAngle(s.i));
        if (plans && s.marked) { for (let k = -3; k <= 3; k++) { f.set(mx + k, my + k, '#ff5a4a'); f.set(mx + k, my - k, '#ff5a4a'); } }
        if (!plans) {
          for (let k = 0; k < 5; k++) { const [bx, by] = at(segAngle(s.i, 0.15 + k * 0.17)); f.rect(bx - 2, by - 2, 4, 4, '#26262c'); f.rect(bx - 1, by - 1, 2, 2, s.hit === 'breach' ? '#6a4a3a' : '#7a7a82'); }
          if (s.hit === 'breach') for (let k = 0; k < 40; k++) { const [bx, by] = at(segAngle(s.i, hash(k, s.i, 1)), 1 + (hash(k, s.i, 2) - 0.5) * 0.12); f.set(bx, by, k % 3 ? '#5a4030' : '#8a6a4a'); }
          if (s.known === 'weak' && !s.hit) for (let k = -2; k <= 2; k++) { f.set(mx + k, my - 8, '#ffd84a'); f.set(mx, my - 8 + k, '#ffd84a'); }
          if (s.known === 'strong' && !s.hit) f.rect(mx - 3, my - 9, 7, 2, '#ff8a6a');
        }
      });
      if (!plans) { // your army waiting outside the ring
        for (let k = 0; k < 6; k++) { const [x, y] = at(A0 + (A1 - A0) * (k + 0.5) / 6, 1.35); f.rect(x - 4, y - 3, 9, 7, '#0b1018'); f.rect(x - 3, y - 2, 7, 5, '#c85040'); f.line(x - 2, y - 1, x + 2, y + 1, '#f4ecd0'); f.line(x + 2, y - 1, x - 2, y + 1, '#f4ecd0'); }
      }
      blasts.forEach(b => {
        const p = ((t + b.o) % 0.8) / 0.8;
        if (p < 0.35) { f.disc(b.x, b.y, 1 + Math.round(p * 10), '#ffb04a'); f.disc(b.x, b.y, Math.round(p * 5), '#fff1b8'); }
        else for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy < 16 && dith(b.x + dx, b.y + dy, 0.9 - p)) f.set(b.x + dx, b.y + dy - Math.round(p * 5), '#5a5a62');
      });
      f.to(cv);
    };

    const placeHots = () => {
      hots.replaceChildren();
      seg.forEach(s => {
        const [x, y] = at(segAngle(s.i));
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mg-hot'; b.dataset.seg = String(s.i);
        b.setAttribute('aria-label', `Sector ${s.i + 1} of the ring`);
        b.style.left = `${x / W * 100}%`; b.style.top = `${y / H * 100}%`;
        b.addEventListener('click', () => strike(s));
        hots.append(b);
      });
    };

    const update = () => {
      $f('br').textContent = `${breaches} / 2`;
      $f('sh').textContent = String(shells);
      $f('rc').textContent = String(recon);
      const assault = phase === 'assault';
      $f('help').textContent = phase === 'study'
        ? `These are the stolen plans. Red marks the unfinished sections. Memorise them: in ${Math.ceil(studyLeft)} seconds the plans go back to the safe.`
        : assault ? 'Choose a tool, then click a sector of the ring. Two breaches will open the way into Bilbao. The plans are months old, so the Basques may have changed things since.' : '';
      $f('t-barrage').className = tool === 'barrage' ? 'sel' : ''; $f('t-recon').className = tool === 'recon' ? 'sel' : '';
      $f('t-barrage').disabled = !assault || busy || shells <= 0; $f('t-recon').disabled = !assault || busy || recon <= 0;
      $f('ready').hidden = phase !== 'study';
      hots.querySelectorAll('.mg-hot').forEach(b => {
        const s = seg[+b.dataset.seg];
        b.disabled = !assault || busy || !!s.hit;
        b.className = 'mg-hot' + (s.hit ? ` ${s.hit}` : s.known ? ` k-${s.known}` : '');
      });
      ov.dataset.phase = phase;
    };

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

    const startStudy = secs => {
      phase = 'study'; studyLeft = secs; update(); draw(0); sfx('paper');
      let last = performance.now();
      timer = setInterval(() => {
        const now = performance.now(); studyLeft -= (now - last) / 1000; last = now;
        if (studyLeft <= 0) endStudy(); else update();
      }, 100);
    };
    function endStudy() {
      if (phase !== 'study') return;
      clearInterval(timer); timer = 0;
      phase = 'assault'; sfx('paper'); update(); draw(0);
      $f('note').textContent = 'Recon flights show a sector\'s true state. Barrages on a weak sector open a breach; on a strong one they waste shells and men.';
    }

    function strike(s) {
      if (phase !== 'assault' || busy || s.hit) return;
      if (tool === 'recon') {
        if (recon <= 0) return;
        recon--; s.known = s.weak ? 'weak' : 'strong'; sfx('select');
        $f('note').textContent = s.weak ? 'The photographs show unfinished bunkers and a gap in the wire.' : 'The photographs show new concrete and fresh wire.';
        if (recon <= 0) tool = 'barrage';
        update(); draw(0); return;
      }
      if (shells <= 0) return;
      shells--; used++; busy = true; update();
      const [mx, my] = at(segAngle(s.i));
      blasts = Array.from({ length: 6 }, () => ({ x: mx + Math.round((rand(S) - 0.5) * 22), y: my + Math.round((rand(S) - 0.5) * 14), o: rand(S) }));
      sfx('boom');
      const done = () => {
        cancelAnimationFrame(anim); blasts = []; busy = false;
        const cost = s.weak ? 500 : 1500;
        lost += late ? cost : Math.round(cost / 3);
        if (s.weak) { s.hit = 'breach'; breaches++; sfx('good'); $f('note').textContent = 'The barrage tears through half-built bunkers. A breach is open!'; }
        else { s.hit = 'held'; sfx('bad'); $f('note').textContent = 'The concrete holds. Basque machine guns cut down the assault parties.'; }
        update(); draw(0);
        if (breaches >= 2 || shells <= 0) setTimeout(finish, motionOn() ? 600 : 0);
      };
      if (motionOn()) {
        const t0 = performance.now();
        const loop = now => { const t = (now - t0) / 1000; draw(t); if (t < 1.4) anim = requestAnimationFrame(loop); else done(); };
        anim = requestAnimationFrame(loop);
      } else done();
    }

    function finish() {
      phase = 'done'; update();
      const won = breaches >= 2;
      let fx;
      if (won) fx = used <= 2 ? { delay: -6, morale: 5, inf: { franco: 4 } } : used === 3 ? { delay: -2, morale: 3 } : { morale: 1 };
      else if (breaches === 1) fx = { delay: 6, morale: -3 };
      else fx = { delay: 12, morale: -6, inf: { franco: -3 } };
      S.tS = Math.max(0, S.tS - lost - (won ? 0 : late ? 4000 : 1200));
      applyFx(S, fx);
      renderHUD(S, ctx.D);
      const score = won ? Math.max(40, 100 - (used - 2) * 20 - (2 - recon) * 5) : breaches * 20;
      const you = won ? `You broke the ring with ${used} barrage${used > 1 ? 's' : ''} and ${2 - recon} recon flight${2 - recon === 1 ? '' : 's'}.` : `You opened ${breaches} breach${breaches === 1 ? '' : 'es'} and had to grind through the ring.`;
      S.ledger.push({ k: 'The Iron Ring', you, hist: 'Bilbao\'s "Iron Ring" was betrayed by one of its engineers, Alejandro Goicoechea, who crossed the lines with its plans in early 1937. Nationalist troops broke through on 12 June 1937 after a heavy bombardment, and Bilbao fell a week later.' });
      const text = won
        ? `Your infantry pour through the breaches and the Basque defenders fall back on the city. ${used <= 2 ? 'Not a shell was wasted.' : 'It cost more shells than it should have.'} ${seg[fixed].hit === 'held' ? 'The section the plans called unfinished had been rebuilt since Goicoechea fled.' : ''}`
        : `The ring holds where you struck it. In the end your army has to batter its way through, sector by sector, and it takes days longer.${seg[fresh].weak && !seg[fresh].hit ? ' The photographs would have shown you a new gap the plans never knew about.' : ''}`;
      sfx(won ? 'fanfare' : 'bad');
      message(won ? 'The ring is broken' : 'The ring holds', text.trim(), chips(before, snapshot(S), S, ctx.D), [['CONTINUE ▶', 'enter', () => {
        ov.hidden = true; overrideMusic(null);
        resolve({ score, text: you });
      }]]);
    }

    $f('t-barrage').addEventListener('click', () => { tool = 'barrage'; update(); });
    $f('t-recon').addEventListener('click', () => { if (recon > 0) { tool = 'recon'; update(); } });
    $f('ready').addEventListener('click', endStudy);

    placeHots(); update(); draw(0);
    message('The Iron Ring', 'Bilbao is surrounded by a ring of bunkers, trenches and wire in the hills: the Cinturón de Hierro. One of its engineers has crossed the lines with the plans. You will see them for a few seconds. Remember where the ring was left unfinished, then break through with four artillery barrages and two reconnaissance flights. You need two breaches.',
      null, [['STUDY THE PLANS ▶', 'enter', () => startStudy(STUDY)], ['STUDY FOR LONGER', 'n', () => startStudy(STUDY * 2)]]);
  });
}

// Mini-game: the Ebro crossing, 25 July 1938, in real time.
// The Republic crosses at night in boats and throws pontoon bridges over the river. Every finished
// bridge pours troops toward Gandesa. Shell the crossings by night; by day, send the bombers.
// Rush reserves to Gandesa, and once, open the dams upstream to flood the river.
import { FB, dith, hash, noise } from '../engine/pixel.js';
import { rand, clamp, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { renderHUD } from '../screens/hud.js';
import { sfx, overrideMusic } from '../audio/audio.js';
import { motionOn } from '../settings.js';

const W = 320, H = 180, GX = 62, GY = 104;
const NIGHT = 18, END = 72, DAMS_AT = 30, FLOOD = 8;
const CROSS = ['Fayón', 'Flix', 'Ascó', 'Móra', 'Miravet', 'Benifallet'].map((n, i) => ({ n, y: 30 + i * 24 }));
const riverX = y => Math.round(214 + 14 * Math.sin(y / 30) + 5 * Math.sin(y / 11));
let MAP = null;

function baseMap() {
  const fb = new FB(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = noise(x, y, 14, 21) * 0.65 + noise(x, y, 5, 22) * 0.35 + (dith(x, y, 0.5) ? 0.03 : 0);
    let c = h > 0.62 ? '#8a6a44' : h > 0.42 ? '#a07c4e' : '#b48e5a';
    if (hash(x, y, 23) < 0.04) c = '#6a5034';
    fb.set(x, y, c);
  }
  // the Sierras de Pàndols and Cavalls between the river and Gandesa
  [[132, 70, 30, 12], [150, 128, 34, 14], [110, 40, 20, 8]].forEach(([cx, cy, rx, ry]) => {
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) continue;
      fb.set(x, y, dith(x, y, 0.5) ? '#6a5034' : '#7a5c3c');
      if (hash(x, y, 24) < 0.05) fb.set(x, y, '#c8b08a');
    }
  });
  // roads from each crossing to Gandesa
  CROSS.forEach(c => {
    const x0 = riverX(c.y) - 4;
    for (let k = 0; k <= 100; k++) { const t = k / 100, x = Math.round(x0 + (GX + 8 - x0) * t), y = Math.round(c.y + (GY - c.y) * t + Math.sin(t * 7 + c.y) * 3); fb.set(x, y, '#d8c49a'); }
  });
  // villages on the east bank
  CROSS.forEach(c => { const x = riverX(c.y) + 10; for (let k = 0; k < 5; k++) fb.rect(x + (k % 3) * 4, c.y - 4 + Math.floor(k / 3) * 4, 3, 3, '#e0d4b8'); });
  // Gandesa
  for (let k = 0; k < 14; k++) fb.rect(GX - 8 + (k % 5) * 4, GY - 6 + Math.floor(k / 5) * 4, 3, 3, k % 3 ? '#e0d4b8' : '#c8b898');
  fb.rect(GX + 1, GY - 12, 3, 6, '#e0d4b8'); fb.set(GX + 2, GY - 13, '#a8452c');
  return fb;
}

export function ebroCrossing(S, ctx) {
  return new Promise(resolve => {
    if (!MAP) MAP = baseMap();
    const before = snapshot(S), late = S.ch >= 6;
    const st = CROSS.map(c => ({ ...c, on: false, b: 0, wait: 0, hush: 0 }));
    const order = st.map((_, i) => i).sort(() => rand(S) - 0.5);
    order.slice(0, S.flags.ebroReady ? 3 : 4).forEach(i => { st[i].on = true; });
    const maxSorties = Math.min(6, 2 + Math.floor(S.ger / 30) + (S.flags.ebroReady ? 1 : 0));
    let t = 0, D = 0, speed = 1, tool = 'guns', sorties = [], reserves = 3, resCd = 0, gunCd = 0, dams = false, flood = 0, lost = 0, ammoUsed = 0;
    let running = false, raf = 0, last = 0, blasts = [], planes = [], over = false, dawn = false;

    const ov = document.getElementById('ov-ebro');
    ov.hidden = false;
    overrideMusic('ebroGame');
    ov.innerHTML = `<canvas class="mg-cv" aria-label="Map of the Ebro front"></canvas><div class="mg-hots"></div>
      <div class="pnl mg-top"><span class="t">THE EBRO</span><span class="m" data-f="clock"></span>
        <span class="m"><b>TOWARD GANDESA</b> <span class="gbar"><i data-f="dbar"></i></span> <span data-f="dv"></span></span>
        <span class="m"><b>BOMBERS</b> <span data-f="sorties"></span></span><span class="m"><b>AMMO</b> <span data-f="ammo"></span></span>
        <span class="help" data-f="help"></span></div>
      <div class="pnl mg-bot"><button type="button" data-f="t-guns" data-key="1">1 ARTILLERY</button><button type="button" data-f="t-bomb" data-key="2">2 BOMBERS</button>
        <button type="button" data-f="res" data-key="r">RESERVES TO GANDESA [R]</button><button type="button" data-f="dams" data-key="d">OPEN THE DAMS [D]</button>
        <span class="note" data-f="note"></span></div>
      <div class="pnl mg-msg" data-f="msg" hidden></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const cv = ov.querySelector('.mg-cv'), hots = ov.querySelector('.mg-hots');
    const night = () => t < NIGHT;
    const free = () => maxSorties - sorties.length;

    const clockText = () => {
      if (t < NIGHT) return 'NIGHT OF 24–25 JULY';
      const d = 25 + Math.floor((t - NIGHT) / 9);
      return d <= 31 ? `${d} JULY` : '1 AUGUST';
    };

    const draw = () => {
      const f = MAP.copy();
      // the bridgehead: Republican ground on your side of the river
      const reach = D / 100;
      for (let y = 8; y < H - 8; y++) {
        const spread = 1 - Math.abs(y - 92) / 92, rx = riverX(y), left = rx - (rx - GX) * reach * Math.max(0, spread * 1.2);
        for (let x = Math.floor(left); x < rx - 3; x++) if (dith(x, y, 0.45)) f.set(x, y, '#3d64a0');
        if (reach > 0.02 && left < rx - 4) { f.set(Math.floor(left), y, '#ffd84a'); f.set(Math.floor(left) + 1, y, '#ffd84a'); }
      }
      // the river, wider and paler in flood
      for (let y = 0; y < H; y++) {
        const x = riverX(y), w = flood > 0 ? 9 : 5;
        f.rect(x - (w >> 1), y, w, 1, flood > 0 ? '#6a9ac8' : '#3f7cb0'); f.set(x - (w >> 1), y, '#24427e');
        if (flood > 0 && hash(x, y, Math.floor(t * 8)) < 0.3) f.set(x + Math.floor(hash(y, 1, 3) * w) - (w >> 1), y, '#d6ecff');
      }
      // night: the land goes dark blue, but boats, bridges and shell bursts still show
      if (night()) { const d = f.d; for (let k = 0; k < d.length; k += 4) { d[k] = d[k] * 0.3 + 8; d[k + 1] = d[k + 1] * 0.34 + 14; d[k + 2] = d[k + 2] * 0.5 + 42; } }
      // bridges, boats, troops
      st.forEach((c, i) => {
        const rx = riverX(c.y), len = Math.round(9 * c.b / 100);
        for (let k = 0; k < len; k++) { f.rect(rx + 4 - k, c.y - 1, 1, 3, k % 2 ? '#8a6034' : '#5e4022'); }
        if (c.b >= 100) for (let k = 0; k < 4; k++) { const p = ((t * 0.7 + k / 4 + i * 0.13) % 1); f.rect(Math.round(rx + 4 - p * 30), c.y + (k % 2) - 1, 2, 2, '#c8d8f0'); }
        if (c.on && night() && c.hush <= 0) for (let k = 0; k < 2; k++) { const p = ((t * 0.5 + k / 2 + i * 0.3) % 1); f.rect(Math.round(rx + 6 - p * 12), c.y - 4 + k * 8, 4, 2, '#5e4022'); }
      });
      planes.forEach(p => {
        const x = Math.round(p.x), y = Math.round(p.y);
        f.rect(x - 4, y, 9, 1, '#1a1a22'); f.rect(x - 1, y - 3, 2, 7, '#1a1a22'); f.rect(x - 4, y - 1, 1, 3, '#1a1a22');
      });
      blasts.forEach(b => {
        const p = (t - b.t0) / 0.9;
        if (p < 0.3) { f.disc(b.x, b.y, 1 + Math.round(p * 12), '#ffb04a'); f.disc(b.x, b.y, Math.round(p * 6), '#fff1b8'); }
        else for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy < 16 && dith(b.x + dx, b.y + dy, 1 - p)) f.set(b.x + dx, b.y + dy - Math.round(p * 6), '#5a5a62');
      });
      f.to(cv);
    };

    const placeHots = () => {
      hots.replaceChildren();
      st.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mg-hot ebro'; b.dataset.cross = String(i);
        b.textContent = c.n; b.setAttribute('aria-label', `Crossing at ${c.n}`);
        b.style.left = `${(riverX(c.y) + 2) / W * 100}%`; b.style.top = `${c.y / H * 100}%`;
        b.addEventListener('click', () => hit(i));
        hots.append(b);
      });
    };

    const update = () => {
      $f('clock').textContent = clockText();
      $f('dbar').style.width = `${Math.min(100, D)}%`; $f('dv').textContent = `${Math.round(D)}%`;
      $f('dv').className = D >= 70 ? 'warn' : D >= 40 ? 'mid' : 'ok';
      $f('sorties').textContent = night() ? 'GROUNDED (NIGHT)' : `${free()} / ${maxSorties}`;
      $f('ammo').textContent = String(Math.round(S.ammo));
      $f('t-guns').className = tool === 'guns' ? 'sel' : ''; $f('t-bomb').className = tool === 'bomb' ? 'sel' : '';
      $f('t-bomb').disabled = !running || night();
      $f('t-guns').disabled = !running;
      $f('res').disabled = !running || reserves <= 0 || resCd > 0;
      $f('res').textContent = `RESERVES TO GANDESA (${reserves}) [R]`;
      $f('dams').disabled = !running || dams || t < DAMS_AT;
      $f('dams').textContent = dams ? 'DAMS OPENED' : t < DAMS_AT ? 'DAMS: FROM 26 JULY' : 'OPEN THE DAMS [D]';
      $f('help').textContent = night()
        ? 'Boats are crossing in the dark and bridges are going up. Bombers cannot fly at night: shell the crossings with your artillery.'
        : 'Every finished bridge sends troops toward Gandesa. Bomb the bridges, shell them, and hold Gandesa until the offensive runs out of steam.';
      hots.querySelectorAll('.mg-hot').forEach(b => {
        const c = st[+b.dataset.cross];
        b.disabled = !running;
        b.className = 'mg-hot ebro' + (c.b >= 100 ? ' bridge' : c.on ? ' busy' : '');
      });
      ov.dataset.t = String(Math.floor(t));
    };

    function hit(i) {
      if (!running) return;
      const c = st[i], rx = riverX(c.y);
      if (tool === 'bomb' && !night()) {
        if (free() <= 0) { $f('note').textContent = 'All your bombers are in the air. Wait for one to come back.'; return; }
        const p = { x: -10, y: c.y, tx: rx, i, back: t + 14, hit: false };
        planes.push(p); sorties.push(p); sfx('select');
        return;
      }
      if (gunCd > 0) { $f('note').textContent = 'The guns are reloading.'; return; }
      if (S.ammo < 2) { $f('note').textContent = 'Your guns are out of shells.'; return; }
      gunCd = 2.5; S.ammo = clamp(S.ammo - 2, 0, 100); ammoUsed += 2;
      c.b = Math.max(0, c.b - 45); c.hush = 4; c.wait = Math.max(c.wait, 1);
      blasts.push({ x: rx + Math.round((rand(S) - 0.5) * 8), y: c.y + Math.round((rand(S) - 0.5) * 6), t0: t });
      sfx('boom');
    }

    const reserve = () => {
      if (!running || reserves <= 0 || resCd > 0) return;
      reserves--; resCd = 3; D = Math.max(0, D - 12); lost += late ? 2500 : 800;
      $f('note').textContent = 'Fresh divisions are rushed into the line in front of Gandesa.'; sfx('stamp');
    };
    const openDams = () => {
      if (!running || dams || t < DAMS_AT) return;
      dams = true; flood = FLOOD; st.forEach(c => { c.b = 0; c.wait = FLOOD; });
      $f('note').textContent = 'The floodgates at Camarasa and Tremp are opened. A wall of water sweeps the pontoons away.'; sfx('boom');
    };

    const step = dt => {
      t += dt; gunCd = Math.max(0, gunCd - dt);
      if (!dawn && !night()) { dawn = true; tool = 'bomb'; $f('note').textContent = 'Dawn. Your bombers are taking off.'; sfx('takeoff'); } resCd = Math.max(0, resCd - dt); flood = Math.max(0, flood - dt);
      // more crossings join the attack as the night goes on
      st.forEach((c, i) => { if (!c.on && t > 6 + order.indexOf(i) * 7) c.on = true; });
      let flow = 0;
      st.forEach(c => {
        c.hush = Math.max(0, c.hush - dt); c.wait = Math.max(0, c.wait - dt);
        if (!c.on) return;
        if (flood <= 0 && c.wait <= 0 && c.b < 100) c.b = Math.min(100, c.b + (night() ? 6 : 7) * speed * dt);
        if (c.b >= 100) flow += 0.6;
        if (night() && c.hush <= 0) flow += 0.22;
      });
      D = clamp(D + flow * speed * dt * (1 - D / 150), 0, 100);
      // bombers fly in from the west, drop, and fly home
      planes.forEach(p => {
        if (!p.hit) {
          p.x += 120 * dt;
          if (p.x >= p.tx) {
            p.hit = true; const c = st[p.i];
            c.b = Math.max(0, c.b - 80); c.wait = 2;
            for (let k = 0; k < 3; k++) blasts.push({ x: p.tx + Math.round((rand(S) - 0.5) * 10), y: c.y + Math.round((rand(S) - 0.5) * 8), t0: t + k * 0.12 });
            sfx('boom');
          }
        } else p.x += 120 * dt;
      });
      planes = planes.filter(p => p.x < W + 20);
      sorties = sorties.filter(p => p.back > t);
      blasts = blasts.filter(b => t - b.t0 < 0.9);
      if (D >= 100 || t >= END) finish();
    };

    const loop = now => {
      if (!running) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      step(dt);
      if (!running) return;
      update(); draw();
      raf = requestAnimationFrame(loop);
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

    const begin = sp => { speed = sp; running = true; last = performance.now(); update(); raf = requestAnimationFrame(loop); };

    function finish() {
      if (over) return;
      over = true; running = false; cancelAnimationFrame(raf);
      update(); draw();
      const d = Math.round(D);
      let fx, title, text;
      if (d >= 100) {
        title = 'Gandesa falls';
        text = 'The Republic\'s columns break into Gandesa and the road west lies open. Your reserves stop them in the hills beyond, but the bridgehead is deep and it will take months to destroy.';
        fx = { delay: 25, morale: -10, inf: { franco: -6 }, legit: -4, flag: { gandesaFell: 1 } };
      } else if (d >= 35) {
        title = 'Gandesa holds';
        text = `The Republican offensive runs out of steam in front of Gandesa, ${d}% of the way from the river. The bridgehead is there to stay, for now.`;
        fx = { morale: -2 };
      } else {
        title = 'The crossing is contained';
        text = `Your bombers and guns keep the bridges down. The Republic's army is pinned in a shallow bridgehead, only ${d}% of the way to Gandesa.`;
        fx = { delay: -12, morale: 6, inf: { franco: 4 }, flag: { ebroWell: 1 } };
      }
      S.tS = Math.max(0, S.tS - lost - (late ? 4000 + d * 80 : 1200 + d * 20));
      applyFx(S, fx);
      renderHUD(S, ctx.D);
      const you = d >= 100 ? 'The Republic took Gandesa.' : `The bridgehead reached ${d}% of the way to Gandesa.${dams ? ' You opened the dams.' : ''}`;
      S.ledger.push({ k: 'The Ebro crossing', you, hist: 'On the night of 24–25 July 1938 the Republic\'s Army of the Ebro crossed the river and advanced almost to Gandesa, where it was stopped. Nationalist aircraft bombed the pontoon bridges day after day, and dams upstream were opened to flood the river.' });
      sfx(d >= 100 ? 'bad' : d < 35 ? 'fanfare' : 'good');
      message(title, text, chips(before, snapshot(S), S, ctx.D), [['CONTINUE ▶', 'enter', () => {
        ov.hidden = true; overrideMusic(null);
        resolve({ score: Math.max(0, 100 - d), text: you });
      }]]);
    }

    $f('t-guns').addEventListener('click', () => { tool = 'guns'; update(); });
    $f('t-bomb').addEventListener('click', () => { if (!night()) { tool = 'bomb'; update(); } });
    $f('res').addEventListener('click', reserve);
    $f('dams').addEventListener('click', openDams);

    placeHots(); update(); draw();
    message('The Ebro', `It is the night of 24 July 1938. Across the river, the Republic's Army of the Ebro is launching boats and building pontoon bridges. Every bridge it finishes sends men toward Gandesa, the town behind your lines. Shell the crossings with your artillery tonight. At dawn your ${maxSorties} bomber squadrons can fly. You have three divisions of reserves, and from 26 July you can open the dams upstream to flood the river once. Hold for a week.${motionOn() ? '' : ' (This mini-game runs in real time.)'}`,
      null, [['BEGIN ▶', 'enter', () => begin(1)], ['PLAY AT HALF SPEED', 'n', () => begin(0.6)]]);
  });
}

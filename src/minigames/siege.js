// Mini-game: the assault on Madrid, 8-19 November 1936.
// Three days. Each day you spread five columns across four sectors, pick targets for bombers and
// artillery, send one reconnaissance flight, and decide whether to bomb the city. Breaking through
// any sector inside the city takes Madrid. Historically the attack stalled.
import { FB, vgrad, dith, hash, rng } from '../engine/pixel.js';
import { rand, clamp, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { renderHUD } from '../screens/hud.js';
import { sfx, overrideMusic } from '../audio/audio.js';
import { motionOn } from '../settings.js';

const SECTORS = [
  { id: 'casa', n: 'Casa de Campo', def: 6, at: [48, 70], note: 'Open parkland west of the river. Taking it exposes University City.' },
  { id: 'uni', n: 'University City', def: 8, at: [124, 26], note: 'New faculty buildings north-west, across the river. A road into the city.' },
  { id: 'cara', n: 'Carabanchel', def: 10, at: [52, 152], note: 'Dense streets south-west. Every house a strongpoint.' },
  { id: 'usera', n: 'Usera', def: 8, at: [134, 160], note: 'Southern suburbs across the Manzanares bridges.' }
];
const COLUMNS = ['Asensio', 'Barrón', 'Castejón', 'Delgado', 'Tella'];
const DAYS = [{ label: '8 NOVEMBER', reinf: 0, why: '' },
  { label: '15 NOVEMBER', reinf: 3, why: 'The International Brigades are in the line.' },
  { label: '19 NOVEMBER', reinf: 5, why: "Durruti's column and Soviet fighters have arrived." }];
// The map fills the left part of the screen; the control panel sits to its right.
const W = 196, H = 180;
let MAP = null;

const riverX = y => Math.round(92 - 11 * Math.sin(y / 55) + y * 0.04);

function drawMap() {
  const fb = new FB(W, H), R = rng(41);
  vgrad(fb, 0, H, ['#4a4436', '#3e3a2e']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hash(x, y, 3) < 0.05) fb.set(x, y, '#5a5240');
  // Casa de Campo
  for (let y = 22; y < 122; y++) for (let x = 12; x < riverX(y) - 5; x++) {
    if (dith(x, y, 0.5)) fb.set(x, y, '#3e5a2a'); else fb.set(x, y, '#4a6a32');
    if (hash(x, y, 7) < 0.06) { fb.set(x, y, '#2a4020'); fb.set(x, y - 1, '#5a7a3a'); }
  }
  const block = (x, y, w, h, c, d) => { fb.rect(x, y, w, h, c); fb.rect(x, y + h - 1, w, 1, d); fb.rect(x + w - 1, y, 1, h, d); };
  // the city, east of the river, with the Retiro park
  for (let y = 44; y < 146; y += 8) for (let x = 100; x < 192; x += 9) {
    if (x < riverX(y) + 8) continue;
    if (x > 156 && x < 186 && y > 82 && y < 110) continue;
    block(x, y, 7 + (hash(x, y) < 0.3 ? 1 : 0), 6, R() < 0.5 ? '#a89a80' : '#958870', '#6a604c');
  }
  for (let y = 82; y < 108; y++) for (let x = 158; x < 184; x++) fb.set(x, y, dith(x, y, 0.5) ? '#3e5a2a' : '#4a6a32');
  // University City: larger separate buildings
  [[102, 10, 14, 8], [120, 8, 12, 10], [138, 14, 14, 8], [106, 26, 10, 8], [124, 28, 14, 7], [142, 28, 10, 9]].forEach(([x, y, w, h]) => block(x, y, w, h, '#c8bca4', '#8a7c64'));
  // Carabanchel and Usera: dense small blocks
  for (let y = 132; y < 174; y += 6) for (let x = 22; x < riverX(y) - 8; x += 7) block(x, y, 5, 4, '#8a7c64', '#5a5040');
  for (let y = 146; y < 176; y += 6) for (let x = riverX(y) + 10; x < 170; x += 7) block(x, y, 5, 4, '#8a7c64', '#5a5040');
  // the Manzanares
  for (let y = 0; y < H; y++) { const x = riverX(y); fb.rect(x - 2, y, 5, 1, '#3a5a7a'); fb.set(x - 2, y, '#5a7a9a'); }
  // landmarks: Royal Palace, Telefónica tower
  block(108, 76, 12, 8, '#e2d6bc', '#8a7c64');
  fb.rect(146, 62, 4, 14, '#d8ccb0'); fb.rect(147, 58, 2, 4, '#d8ccb0');
  return fb;
}

export function siege(S, ctx) {
  return new Promise(resolve => {
    if (!MAP) MAP = drawMap();
    const before = snapshot(S);
    const prog = { casa: 0, uni: 0, cara: 0, usera: 0 };
    const known = { casa: true, uni: false, cara: false, usera: false };
    let day = 0, assign = { casa: 1, uni: 2, cara: 1, usera: 1 }, air = null, art = null, bombCity = false, scouted = false, resolveBonus = 0;
    const hasAir = S.ger >= 40 || S.ita >= 40;
    const airBonus = S.flags.condor || S.flags.moreAir ? 0.45 : 0.35;
    let busy = false, anim = 0, blasts = [];

    const ov = document.getElementById('ov-siege');
    ov.hidden = false;
    overrideMusic('siege');
    ov.innerHTML = `<canvas class="siege-cv" aria-label="Map of Madrid"></canvas><div class="siege-labels"></div>
      <div class="pnl siege-side"><div class="t">MADRID · <span data-f="day"></span></div><p class="sub" data-f="sub"></p>
        <div class="sectors" data-f="rows"></div>
        <div class="opts"><label><input type="checkbox" data-f="bomb"> Bomb the city itself</label><span data-f="free"></span></div>
        <div class="acts"><button type="button" class="primary" data-f="go" data-key="enter">ATTACK ▶</button></div>
        <p class="msg" data-f="msg"></p></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const cv = ov.querySelector('.siege-cv'), labels = ov.querySelector('.siege-labels');

    const str = () => S.tS / 5000 * (0.6 + S.morale / 250);
    const used = () => Object.values(assign).reduce((a, b) => a + b, 0);
    const defOf = id => {
      const s = SECTORS.find(x => x.id === id);
      let d = s.def + DAYS[Math.min(day, 2)].reinf + resolveBonus;
      if (id === 'uni' && prog.casa >= 100) d -= 3;
      if (S.flags.rush && day === 0) d -= 1;
      return d;
    };

    const paint = t => {
      const f = MAP.copy();
      // front line: west edge of Casa de Campo until it falls, then the river
      for (let y = 0; y < H; y += 2) {
        const x = prog.casa >= 100 || y < 22 || y > 122 ? riverX(y) - 6 : 10;
        f.set(x, y, '#ffd84a'); f.set(x + 1, y, '#ffd84a');
      }
      blasts.forEach(b => {
        const p = ((t + b.o) % 0.9) / 0.9;
        if (p < 0.3) { f.disc(b.x, b.y, 1 + Math.round(p * 12), '#ffb04a'); f.disc(b.x, b.y, Math.round(p * 6), '#fff1b8'); }
        else for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy < 16 && dith(b.x + dx, b.y + dy - Math.round(p * 6), 0.9 - p)) f.set(b.x + dx, b.y + dy - Math.round(p * 6), '#6a5e6e');
      });
      f.to(cv);
    };

    const renderLabels = () => {
      labels.replaceChildren();
      SECTORS.forEach(s => {
        const d = document.createElement('div');
        d.className = 'slbl' + (prog[s.id] >= 100 ? ' taken' : '');
        d.style.left = `${s.at[0] / W * 100}%`; d.style.top = `${s.at[1] / H * 100}%`;
        d.innerHTML = `<b></b><span class="pb"><i style="width:${Math.min(100, prog[s.id])}%"></i></span><em></em>`;
        d.querySelector('b').textContent = s.n;
        d.querySelector('em').textContent = `${assign[s.id]} col.${air === s.id ? ' · AIR' : ''}${art === s.id ? ' · GUNS' : ''}`;
        labels.append(d);
      });
    };

    const render = () => {
      $f('day').textContent = day < 3 ? `DAY ${day + 1} OF 3 · ${DAYS[day].label}` : 'THE ASSAULT ENDS';
      $f('sub').textContent = day < 3 ? `Five columns: ${COLUMNS.join(', ')}. Each is worth about ${str().toFixed(1)} against a sector's defence. ${DAYS[day].why}` : '';
      const rows = $f('rows'); rows.replaceChildren();
      SECTORS.forEach(s => {
        const r = document.createElement('div'); r.className = 'srow';
        const d = known[s.id] ? `DEF ${defOf(s.id)}` : 'DEF ?';
        r.innerHTML = `<div class="sh"><b></b><span class="def"></span><span class="pb"><i style="width:${Math.min(100, prog[s.id])}%"></i></span></div><div class="sb"></div>`;
        r.querySelector('b').textContent = s.n; r.querySelector('.def').textContent = prog[s.id] >= 100 ? 'TAKEN' : d;
        r.title = s.note;
        const sb = r.querySelector('.sb');
        const btn = (label, cls, fn, dis, on) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls + (on ? ' sel' : ''); b.textContent = label; b.disabled = !!dis || busy || day >= 3; b.addEventListener('click', fn); sb.append(b); };
        btn('−', 'minus', () => { assign[s.id]--; render(); }, assign[s.id] <= 0);
        const n = document.createElement('span'); n.className = 'cnt'; n.textContent = assign[s.id]; sb.append(n);
        btn('+', 'plus', () => { assign[s.id]++; render(); }, used() >= 5);
        btn('AIR', 'tog', () => { air = air === s.id ? null : s.id; render(); }, !hasAir, air === s.id);
        btn('GUNS', 'tog', () => { art = art === s.id ? null : s.id; render(); }, S.ammo < 10, art === s.id);
        if (!known[s.id]) btn('SCOUT', 'tog', () => { known[s.id] = true; scouted = true; sfx('paper'); render(); }, scouted);
        rows.append(r);
      });
      $f('free').textContent = day < 3 ? `Unassigned: ${5 - used()}${!hasAir ? ' · No bombers: needs Germany or Italy 40+' : ''}${S.ammo < 10 ? ' · Guns need 10 ammo' : ''}` : '';
      $f('bomb').checked = bombCity; $f('bomb').disabled = busy || day >= 3;
      $f('go').disabled = busy;
      $f('go').textContent = day < 3 ? 'ATTACK ▶' : 'CONTINUE ▶';
      renderLabels();
      paint(0);
    };

    $f('bomb').addEventListener('change', e => { bombCity = e.target.checked; });

    const finish = () => {
      overrideMusic(null);
      ov.hidden = true;
      resolve();
    };

    const attack = () => {
      const lines = [];
      const most = Object.keys(assign).reduce((a, b) => (assign[b] > assign[a] ? b : a));
      blasts = [];
      let losses = 0;
      SECTORS.forEach(s => {
        const c = assign[s.id];
        if (prog[s.id] >= 100) return;
        if (!c) { losses += 300; S.morale = clamp(S.morale - 2, 0, 100); lines.push(`${s.n}: unwatched, the defenders counterattack your flank.`); return; }
        let def = defOf(s.id) + (c >= 3 ? (c - 2) * 1.5 : 0) + (bombCity ? -1 : 0);
        if (S.flags.planKnown && day === 0 && s.id === most) def += 4;
        const mult = 1 + (air === s.id ? airBonus : 0) + (art === s.id ? 0.25 : 0) + (S.flags.italTanks ? 0.1 : 0);
        const atk = c * str() * mult * (0.85 + rand(S) * 0.3);
        const gain = Math.max(0, Math.round((atk - def) * 6));
        prog[s.id] = Math.min(100, prog[s.id] + gain);
        losses += Math.round(c * 150 * Math.max(0.5, def / 8));
        lines.push(gain ? `${s.n}: your columns gain ground (+${gain}%).` : `${s.n}: the attack breaks against the defences.`);
        const [bx, by] = s.at;
        for (let k = 0; k < 3 + c; k++) blasts.push({ x: bx + Math.round((rand(S) - 0.5) * 30), y: by + Math.round((rand(S) - 0.5) * 22), o: rand(S) });
      });
      S.tS = Math.max(0, S.tS - losses);
      if (art) S.ammo = clamp(S.ammo - 10, 0, 100);
      if (bombCity) { applyFx(S, { terror: 10, legit: -8 }); lines.push('Your bombers hit the city centre. Madrid\'s resolve hardens.'); }
      resolveBonus = bombCity ? 2 : 0;
      renderHUD(S, ctx.D);
      sfx('boom');
      const broke = SECTORS.find(s => s.id !== 'casa' && prog[s.id] >= 100);
      return { lines, losses, broke };
    };

    $f('go').addEventListener('click', () => {
      if (busy) return;
      if (day >= 3) { finish(); return; }
      busy = true; render();
      const res = attack();
      const show = () => {
        cancelAnimationFrame(anim); blasts = []; paint(0);
        busy = false;
        $f('msg').textContent = res.lines.join(' ') + ` Losses: ${res.losses.toLocaleString('en-US')} men.`;
        if (res.broke) {
          S.flags.madrid = 1; S.end = 'madrid';
          S.ledger.push({ k: 'The battle for Madrid', you: `You broke through at ${res.broke.n} on day ${day + 1} and took Madrid.`, hist: 'Between 8 and 23 November 1936 Franco\'s columns took the Casa de Campo and part of University City, but Madrid held. Franco called off the frontal assault on 23 November.' });
          day = 3; render();
          $f('msg').textContent = `${res.broke.n} gives way. Your columns pour into the streets of Madrid. ` + $f('msg').textContent;
          sfx('fanfare');
          return;
        }
        day++;
        if (day >= 3) {
          const best = SECTORS.reduce((a, b) => (prog[b.id] > prog[a.id] ? b : a));
          S.ledger.push({ k: 'The battle for Madrid', you: `Your furthest advance was at ${best.n} (${prog[best.id]}%). Madrid held.`, hist: 'Between 8 and 23 November 1936 Franco\'s columns took the Casa de Campo and part of University City, but Madrid held. Franco called off the frontal assault on 23 November.' });
          if (S.flags.boast) applyFx(S, { legit: -6 });
          const ch = chips(before, snapshot(S), S, ctx.D).map(c => c.t).join(' · ');
          render();
          $f('msg').textContent = `Madrid holds. ${prog.casa >= 100 ? 'You hold the Casa de Campo. ' : ''}${S.flags.boast ? 'Your promise to take the city by now is quoted back at you. ' : ''}The battle has cost you: ${ch}.`;
          sfx('bad');
          return;
        }
        scouted = false; air = null; art = null; bombCity = false;
        render();
        $f('msg').textContent = res.lines.join(' ') + ` Losses: ${res.losses.toLocaleString('en-US')} men.`;
      };
      if (motionOn()) {
        const t0 = performance.now();
        const loop = now => { const t = (now - t0) / 1000; paint(t); if (t < 1.6) anim = requestAnimationFrame(loop); else show(); };
        anim = requestAnimationFrame(loop);
      } else show();
    });

    render();
    $f('msg').textContent = S.flags.planKnown ? 'Warning: the enemy has your attack plan. Wherever you send the most columns on the first day will be expecting you.' : 'Hover a sector name for details. Scout one unknown sector per day before you commit.';
  });
}

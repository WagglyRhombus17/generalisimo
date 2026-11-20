// The route bar along the top and the beveled panel along the bottom (stats on the left, events on the right).
import { fmtDate } from '../game/state.js';

const $ = s => document.querySelector(s);
const RED = '#ff7a5c';
const word = v => (v >= 70 ? 'HIGH' : v >= 40 ? 'FAIR' : v >= 20 ? 'LOW' : 'CRIT');
const men = n => (n >= 1 ? Math.round(n).toLocaleString('en-US') : '—');

function row(label, v, num, o = {}) {
  const w = Math.max(0, Math.min(100, v));
  return `<div class="stat"><span>${label}</span><span class="bar"><i style="--v:${w}%${o.c ? `;--c:${o.c}` : ''}"></i></span><span class="n${o.warn ? ' warn' : ''}">${num}</span></div>`;
}

export function renderHUD(S, D) {
  const on = !!S;
  $('#hud').hidden = !on;
  $('#route').hidden = !on;
  if (!on) return;
  const ch = D.chapters.chapters[S.ch];
  $('#r-date').textContent = fmtDate(S.day);
  $('#r-stops').innerHTML = S.route.map((s, i) => `<li class="${i < S.pos ? 'done' : i === S.pos ? 'here' : ''}">${s}</li>`).join('');

  const rivals = Object.keys(S.inf).filter(g => g !== 'franco' && (g !== 'sanjurjo' || S.alive.sanjurjo)).sort((a, b) => S.inf[b] - S.inf[a]);
  const top = rivals[0];

  $('#h-col1').innerHTML = '<h4>ARMY</h4>' +
    row('IN SPAIN', S.tS / 150, men(S.tS)) +
    row('IN AFRICA', S.tA / 240, men(S.tA)) +
    row('AMMO', S.ammo, word(S.ammo), S.ammo < 20 ? { c: RED, warn: 1 } : {}) +
    row('FUNDS', S.funds, word(S.funds), S.funds < 15 ? { c: RED, warn: 1 } : {}) +
    row('MORALE', S.morale, word(S.morale), S.morale < 30 ? { c: RED, warn: 1 } : {}) +
    '<h4 class="gap">RACE FOR COMMAND</h4>' +
    row('YOU', S.inf.franco, Math.round(S.inf.franco)) +
    row(D.generals[top].name.toUpperCase(), S.inf[top], Math.round(S.inf[top]), { c: RED });

  $('#h-col2').innerHTML = '<h4>ALLIES</h4>' +
    row('GERMANY', S.ger, `${Math.floor(S.ger / 25)}/4`) +
    row('ITALY', S.ita, `${Math.floor(S.ita / 25)}/4`) +
    '<h4 class="gap">STANDING</h4>' +
    row('LEGITIMACY', S.legit, Math.round(S.legit)) +
    row('TERROR', S.terror, Math.round(S.terror), { c: RED }) +
    `<div class="foot">CH ${ch.n} · ${ch.title.toUpperCase()}<br>SEED ${S.seed}</div>`;

  $('#h-idle').textContent = `CHAPTER ${ch.n} · ${ch.title.toUpperCase()}`;
}

// Full-screen cards: title screen, chapter openings and the ending with its history ledger.
import { fmtDate } from '../game/state.js';
import { settings, setSetting } from '../settings.js';
import { sfx, overrideMusic } from '../audio/audio.js';

const $ = s => document.querySelector(s);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function button(label, key, onClick, cls = '') {
  const b = el('button', cls, label);
  b.type = 'button';
  if (key) b.dataset.key = key;
  b.addEventListener('click', onClick);
  return b;
}

export function showTitle({ hasSave, onNew, onContinue, onSeed }) {
  const ov = $('#ov-title');
  ov.hidden = false;
  ov.replaceChildren();
  const p = el('div', 'title-panel bev');
  p.append(el('div', 'k', 'SPAIN · 1936'), el('h1', null, 'GENERALÍSIMO'),
    el('p', 'sub', 'July 1936. The army has risen against the Republic. You are General Francisco Franco, posted far away in the Canary Islands. Reach your army, find allies abroad, march on Madrid, and make the other generals choose you.'));
  const menu = el('div', 'menu');
  if (hasSave) menu.append(button('CONTINUE ▶', 'enter', onContinue, 'go'));
  menu.append(button('NEW GAME', hasSave ? 'n' : 'enter', onNew, hasSave ? '' : 'go'));
  const seedRow = el('div', 'seed-row');
  const label = el('label', null, 'SEED');
  label.htmlFor = 'seed-in';
  const input = el('input');
  input.id = 'seed-in'; input.inputMode = 'numeric'; input.placeholder = 'e.g. 1936'; input.maxLength = 6;
  seedRow.append(label, input, button('PLAY SEED', null, () => { const n = parseInt(input.value, 10); if (n > 0) onSeed(n); else input.focus(); }));
  menu.append(seedRow);
  p.append(menu);
  const opts = el('div', 'opts');
  const optLabels = () => { const s = settings(); return [`MUSIC: ${s.music ? 'ON' : 'OFF'}`, `SOUND FX: ${s.sfx ? 'ON' : 'OFF'}`, `MOTION: ${s.motion.toUpperCase()}`]; };
  const [bm, bs, bmo] = optLabels().map(t => button(t, null, () => {}));
  const relabel = () => { const l = optLabels(); bm.textContent = l[0]; bs.textContent = l[1]; bmo.textContent = l[2]; };
  bm.onclick = () => { setSetting('music', !settings().music); relabel(); };
  bs.onclick = () => { setSetting('sfx', !settings().sfx); relabel(); };
  bmo.onclick = () => { const order = ['auto', 'on', 'off']; setSetting('motion', order[(order.indexOf(settings().motion) + 1) % 3]); relabel(); };
  bmo.title = 'Auto follows your device\'s reduce-motion setting';
  opts.append(bm, bs, bmo);
  p.append(opts);
  p.append(el('p', 'how', 'Keys: 1–4 choose · Enter continues · M opens the map · G opens the generals. Every run is different; the seed lets you replay one.'));
  p.append(el('p', 'note', 'This game depicts the politics and violence of the Spanish Civil War, including repression, without graphic detail. Each run ends by comparing your choices with what really happened.'));
  ov.append(p);
  const first = p.querySelector('button');
  if (first) first.focus({ preventScroll: true });
}

export function hideTitle() { $('#ov-title').hidden = true; }

export function chapterCard(ch) {
  return new Promise(resolve => {
    const ov = $('#ov-card');
    ov.hidden = false;
    ov.replaceChildren();
    const p = el('div', 'card-panel bev');
    p.append(el('div', 'k', `CHAPTER ${ch.n}`), el('h2', null, ch.title), el('div', 'dates', ch.dates), el('p', null, ch.intro));
    const go = button('BEGIN ▶', 'enter', () => { ov.hidden = true; resolve(); }, 'go');
    p.append(go);
    ov.append(p);
    sfx('stamp');
    go.focus({ preventScroll: true });
  });
}

export function showEnding(S, ctx) {
  const { D } = ctx;
  const E = D.chapters.endings[S.end] || D.chapters.endings.junta;
  const rival = S.rival ? D.generals[S.rival].full : 'another general';
  const ov = $('#ov-end');
  ov.hidden = false;
  overrideMusic(['generalisimo', 'madrid', 'stalemate'].includes(S.end) ? 'finale' : 'tribunal');
  if (S.end === 'dead' || S.end === 'army') sfx('bad');
  ov.replaceChildren();
  const p = el('div', 'end-panel bev');
  p.append(el('div', 'k', `${fmtDate(S.day)} · SEED ${S.seed}`), el('h2', null, E.title), el('p', 'lead', E.text.replace('{rival}', rival)));
  if (S.votes) p.append(el('p', 'votes', S.votes));
  const stats = el('div', 'end-stats');
  [['Army in Spain', Math.round(S.tS).toLocaleString('en-US')], ['Your influence', Math.round(S.inf.franco)], ['Germany', `${Math.floor(S.ger / 25)}/4`],
   ['Italy', `${Math.floor(S.ita / 25)}/4`], ['Legitimacy', Math.round(S.legit)], ['Terror', Math.round(S.terror)]].forEach(([k, v]) => {
    const s = el('div'); s.append(el('b', null, k), el('span', null, String(v))); stats.append(s);
  });
  p.append(stats);
  p.append(el('h3', null, 'YOUR WAR AND THE REAL ONE'));
  const tbl = el('div', 'ledger');
  S.ledger.forEach(r => {
    const row = el('div', 'lrow');
    row.append(el('b', null, r.k), el('span', 'you', r.you), el('span', 'hist', r.hist));
    tbl.append(row);
  });
  if (!S.ledger.length) tbl.append(el('p', null, 'Your run ended before history had much to compare.'));
  p.append(tbl);
  p.append(el('p', 'draft', 'This draft ends in November 1936. Later drafts continue the war into 1937.'));
  const btns = el('div', 'menu');
  btns.append(button('NEW RUN ▶', 'enter', ctx.onNew, 'go'), button('REPLAY THIS SEED', 'r', () => ctx.onSeed(S.seed)), button('TITLE SCREEN', 't', ctx.onMenu));
  p.append(btns);
  ov.append(p);
  p.scrollTop = 0;
  btns.querySelector('button').focus({ preventScroll: true });
}

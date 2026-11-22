// The generals board (direction C): a ranked list on the right, the selected general's file on the left.
// Used on its own (G key) and inside the Salamanca council.
import { bust } from '../engine/bust.js';
import { sfx } from '../audio/audio.js';
import { moodOf, leanText, rivalOf } from '../game/politics.js';

const faces = new Map();
export function faceCanvas(D, g, mood = 'neutral') {
  const k = g + ':' + mood;
  if (!faces.has(k)) faces.set(k, bust(D.generals[g].look, mood));
  const cv = document.createElement('canvas');
  faces.get(k).to(cv);
  return cv;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function tagFor(S, g) {
  if (g === 'franco') return ['YOU', 'you'];
  if (!S.rev[g]) return ['?', 'unk'];
  const l = S.loy[g];
  return l >= 25 ? ['LOYAL', 'loyal'] : l >= 5 ? ['FRIENDLY', 'friend'] : l > -15 ? ['WARY', 'wary'] : ['OPPOSED', 'opp'];
}

export function generalIds(S, D) {
  return Object.keys(D.generals).filter(g => g === 'franco' || S.alive[g] !== false).sort((a, b) => S.inf[b] - S.inf[a]);
}

// root must contain .gb-list and .gb-detail. Returns the selected id.
export function renderBoard(root, S, D, { selected, onSelect }) {
  const ids = generalIds(S, D);
  const sel = selected && ids.includes(selected) ? selected : rivalOf(S);
  const list = root.querySelector('.gb-list'), det = root.querySelector('.gb-detail');
  list.replaceChildren();
  ids.forEach((g, i) => {
    const G = D.generals[g];
    const row = el('button', 'gb-row' + (g === 'franco' ? ' you' : '') + (g === sel ? ' sel' : ''));
    row.type = 'button';
    const bar = el('span', 'ib'), fill = el('i');
    fill.style.width = `${Math.round(S.inf[g])}%`;
    bar.append(fill);
    const [tag, cls] = tagFor(S, g);
    row.append(el('span', 'rk', `#${i + 1}`), faceCanvas(D, g, moodOf(S, g)), el('span', 'nm', G.name), bar, el('span', 'iv', String(Math.round(S.inf[g]))), el('span', 'tag ' + cls, tag));
    row.addEventListener('click', () => { sfx('select'); onSelect(g); });
    list.append(row);
  });

  const G = D.generals[sel];
  det.replaceChildren();
  const info = el('div', 'gb-info');
  info.append(el('h3', null, G.full), el('p', 'role', G.role), el('p', 'wants', `Wants: ${G.wants}`));
  const infRow = el('div', 'meter'), ib = el('span', 'ib'), f = el('i');
  f.style.width = `${Math.round(S.inf[sel])}%`; ib.append(f);
  infRow.append(el('b', null, 'INFLUENCE'), ib, el('span', 'lv', String(Math.round(S.inf[sel]))));
  const loyRow = el('div', 'meter');
  loyRow.append(el('b', null, 'LOYALTY'));
  if (sel === 'franco') loyRow.append(el('span', 'unk', 'This is you.'));
  else if (!S.rev[sel]) loyRow.append(el('span', 'unk', 'Unknown'));
  else {
    const m = el('span', 'lm'), pin = el('i');
    pin.style.left = `${(S.loy[sel] + 100) / 2}%`; m.append(pin);
    loyRow.append(m, el('span', 'lv', (S.loy[sel] > 0 ? '+' : '') + Math.round(S.loy[sel])));
  }
  info.append(infRow, loyRow);
  const lt = leanText(S, sel);
  if (lt) info.append(el('p', 'lean', lt));
  const notes = (S.notes && S.notes[sel]) || [];
  if (notes.length && S.rev[sel]) {
    info.append(el('div', 'k', 'WHAT CHANGED THEIR MIND'));
    const ul = el('ul', 'notes');
    notes.slice(-3).reverse().forEach(n => ul.append(el('li', n.d > 0 ? 'up' : 'dn', `${n.t}: ${n.d > 0 ? '+' : ''}${n.d}`)));
    info.append(ul);
  }
  det.append(faceCanvas(D, sel, moodOf(S, sel)), info);
  return sel;
}

export const BOARD_HTML = '<div class="gboard"><div class="gb-detail"></div><div class="gb-list"></div></div>';

export function openGenerals(S, D) {
  const ov = document.getElementById('ov-gen');
  ov.hidden = false;
  sfx('paper');
  ov.innerHTML = `<div class="council"><div class="t">THE GENERALS<small>Ranked by influence. The general with the most influence will lead unless you change minds. Faces show how each feels about you.</small></div>
    ${BOARD_HTML}<div class="acts"><button type="button" class="primary" data-close>CLOSE [G]</button></div></div>`;
  let sel = null;
  const draw = () => { sel = renderBoard(ov, S, D, { selected: sel, onSelect: g => { sel = g; draw(); } }); };
  draw();
  ov.querySelector('[data-close]').addEventListener('click', closeGenerals);
}

export function closeGenerals() { document.getElementById('ov-gen').hidden = true; }

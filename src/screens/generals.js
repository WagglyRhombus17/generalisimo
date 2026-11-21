// The Influence Board (direction C): every general's influence and, once known, their loyalty to you.
import { portrait } from '../engine/sprites.js';
import { TACT } from '../engine/palettes.js';
import { sfx } from '../audio/audio.js';

const faces = new Map();

export function tagFor(S, g) {
  if (g === 'franco') return ['YOU', 'you'];
  if (!S.rev[g]) return ['?', 'unk'];
  const l = S.loy[g];
  return l >= 25 ? ['LOYAL', 'loyal'] : l >= 5 ? ['FRIENDLY', 'friend'] : l > -15 ? ['WARY', 'wary'] : ['OPPOSED', 'opp'];
}

export function generalIds(S, D) {
  return Object.keys(D.generals).filter(g => g !== 'sanjurjo' || S.alive.sanjurjo).sort((a, b) => S.inf[b] - S.inf[a]);
}

export function renderCards(box, S, D, { selectable = false, selected = null, onSelect = null } = {}) {
  box.replaceChildren();
  const ids = generalIds(S, D);
  box.style.gridTemplateColumns = `repeat(${ids.length}, minmax(0, 1fr))`;
  ids.forEach(g => {
    const G = D.generals[g];
    const pick = selectable && g !== 'franco';
    const card = document.createElement(pick ? 'button' : 'div');
    card.className = 'g' + (g === 'franco' ? ' you' : '') + (selected === g ? ' sel' : '');
    if (pick) { card.type = 'button'; card.addEventListener('click', () => onSelect(g)); }
    const cv = document.createElement('canvas');
    if (!faces.has(g)) faces.set(g, portrait(TACT, G.look));
    faces.get(g).to(cv);
    const [tag, cls] = tagFor(S, g);
    const n = document.createElement('div'); n.className = 'n'; n.textContent = G.name;
    const inf = document.createElement('div'); inf.className = 'inf'; inf.textContent = Math.round(S.inf[g]);
    const t = document.createElement('span'); t.className = 'tag ' + cls; t.textContent = tag;
    card.append(cv, n, inf, t);
    box.append(card);
  });
}

export function openGenerals(S, D) {
  const ov = document.getElementById('ov-gen');
  ov.hidden = false;
  sfx('paper');
  ov.innerHTML = `<div class="council"><div class="t">THE GENERALS<small>Influence decides who leads. Loyalty shows how each general would treat you today. "?" means you have not found out yet.</small></div>
    <div class="gens"></div><p class="detail">Select a general to read their file.</p>
    <div class="acts"><button type="button" class="primary" data-close>CLOSE [G]</button></div></div>`;
  const box = ov.querySelector('.gens'), detail = ov.querySelector('.detail');
  let sel = null;
  const draw = () => renderCards(box, S, D, {
    selectable: true, selected: sel,
    onSelect: g => { sel = g; const G = D.generals[g]; detail.textContent = `${G.full}. ${G.role}. Wants: ${G.wants}`; draw(); }
  });
  draw();
  ov.querySelector('[data-close]').addEventListener('click', closeGenerals);
}

export function closeGenerals() { document.getElementById('ov-gen').hidden = true; }

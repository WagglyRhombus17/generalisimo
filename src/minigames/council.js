// Mini-game: three days of meetings at Salamanca, then the generals vote.
import { rand, clamp, fmtDate } from '../game/state.js';
import { renderCards } from '../screens/generals.js';
import { renderHUD } from '../screens/hud.js';
import { portrait } from '../engine/sprites.js';
import { TACT } from '../engine/palettes.js';
import { sfx, overrideMusic } from '../audio/audio.js';

const ACTIONS = [
  { id: 'promise', t: 'Promise promotion', h: '+25 loyalty · others jealous' },
  { id: 'aid', t: 'Share German aid', h: '+15 loyalty · +4 your influence', req: S => (S.ger >= 40 ? '' : 'Needs Germany 40+') },
  { id: 'front', t: 'Send to the front', h: '−10 influence · −15 loyalty' },
  { id: 'rumour', t: 'Spread a rumour', h: '−14 influence · may backfire' },
  { id: 'canvass', t: 'Kindelán sounds them out', h: 'Reveals every loyalty', noTarget: true }
];

export const voters = S => ['mola', 'queipo', 'cabanellas', 'kindelan', 'orgaz'].concat(S.alive.sanjurjo ? ['sanjurjo'] : []);

function doAction(S, D, a, g) {
  const N = g ? D.generals[g].name : '';
  const fix = id => { S.loy[id] = clamp(S.loy[id], -100, 100); S.inf[id] = clamp(S.inf[id], 0, 100); };
  let msg = '';
  switch (a.id) {
    case 'promise':
      S.loy[g] += 25; S.rev[g] = 1;
      voters(S).forEach(o => { if (o !== g) { S.loy[o] -= 3; fix(o); } });
      msg = `You promise ${N} a senior command after the vote. The others hear about it.`; break;
    case 'aid':
      S.loy[g] += 15; S.inf[g] += 3; S.inf.franco = clamp(S.inf.franco + 4, 0, 100); S.rev[g] = 1;
      msg = `${N}'s troops will get a share of the German aircraft and ammunition, through you.`; break;
    case 'front':
      S.inf[g] -= 10; S.loy[g] -= 15;
      msg = `${N} is sent to inspect the front and misses a day of meetings.`; break;
    case 'rumour':
      S.inf[g] -= 14;
      if (rand(S) < 0.35) { S.legit = clamp(S.legit - 10, 0, 100); S.loy[g] -= 30; S.rev[g] = 1; msg = `The rumour about ${N} is traced back to your staff. He is furious, and the others take note. Legitimacy −10.`; }
      else msg = `Stories about ${N}'s failures circulate in the officers' messes of Salamanca.`;
      break;
    case 'canvass':
      voters(S).forEach(o => { S.rev[o] = 1; });
      msg = 'Kindelán spends the day talking to every general. You now know where each of them stands.'; break;
  }
  if (g) fix(g);
  return msg;
}

export function council(S, ctx) {
  return new Promise(resolve => {
    const { D } = ctx;
    const ov = document.getElementById('ov-council');
    ov.hidden = false;
    overrideMusic('council');
    let turn = 0, sel = null;
    let msg = 'You have three days before the vote. Each day, choose a general and an action.';
    if (S.flags.denied && rand(S) < 0.4) { S.legit = clamp(S.legit - 10, 0, 100); msg = 'Foreign reports about Badajoz have reached the generals, and your denials look thin. Legitimacy −10. ' + msg; }
    ov.innerHTML = `<div class="council"><div class="t">SALAMANCA · <span data-f="day"></span><small>The generals vote on a single commander. Most votes needed to win. Click a general, then an action.</small></div>
      <div class="gens"></div><div class="acts" data-f="acts"></div><p class="detail" data-f="msg"></p></div>`;
    const box = ov.querySelector('.gens'), acts = ov.querySelector('[data-f="acts"]'), msgEl = ov.querySelector('[data-f="msg"]');

    const render = () => {
      ov.querySelector('[data-f="day"]').textContent = turn < 3 ? `DAY ${turn + 1} OF 3` : 'THE VOTE';
      renderCards(box, S, D, { selectable: turn < 3, selected: sel, onSelect: g => { sel = g; render(); } });
      acts.replaceChildren();
      if (turn < 3) {
        ACTIONS.forEach((a, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.dataset.key = String(i + 1);
          const why = a.req ? a.req(S) : '';
          b.disabled = !!why || (!a.noTarget && !sel);
          b.title = why || a.h;
          b.textContent = `${i + 1} ${a.t}`;
          b.addEventListener('click', () => {
            if (b.disabled) return;
            msg = doAction(S, D, a, a.noTarget ? null : sel);
            sfx('stamp');
            turn++; renderHUD(S, D); render();
          });
          acts.append(b);
        });
      } else {
        const go = document.createElement('button');
        go.type = 'button'; go.className = 'primary'; go.dataset.key = 'enter'; go.textContent = 'GO TO THE VOTE ▶';
        go.addEventListener('click', () => { ov.hidden = true; resolve(); }, { once: true });
        acts.append(go);
        go.focus({ preventScroll: true });
      }
      const sub = sel && turn < 3 ? `Selected: ${D.generals[sel].full}. Wants: ${D.generals[sel].wants} ` : '';
      msgEl.textContent = sub + msg;
    };
    render();
  });
}

export function vote(S, ctx) {
  return new Promise(resolve => {
    const { D } = ctx;
    const vs = voters(S);
    const rival = vs.reduce((a, b) => (S.inf[b] > S.inf[a] ? b : a));
    S.rival = rival;
    const results = vs.map(g => {
      if (g === rival) return { g, forYou: false };
      let s = S.loy[g] + (S.inf.franco - S.inf[rival]) * 0.6 + (S.legit - 50) * 0.3 + (S.ger - 50) * 0.15 + (rand(S) * 20 - 10);
      if (S.flags.alcazar) s += 5;
      if (S.flags.madrid) s += 40;
      if (g === 'cabanellas') s -= S.terror * 0.2;
      return { g, forYou: s > 0 };
    });
    const yes = results.filter(r => r.forYou).length, need = Math.floor(vs.length / 2) + 1, won = yes >= need;
    const rivalName = D.generals[rival].name;

    const ov = document.getElementById('ov-vote');
    ov.hidden = false;
    ov.innerHTML = `<div class="council"><div class="t">THE VOTE · ${fmtDate(S.day)}<small>Each general names the man who should command. You need ${need} of ${vs.length}.</small></div>
      <div class="gens vote"></div><div class="tally" data-f="tally"></div><div class="acts" data-f="acts"></div></div>`;
    const box = ov.querySelector('.gens');
    box.style.gridTemplateColumns = `repeat(${vs.length}, minmax(0, 1fr))`;
    const slots = results.map(r => {
      const c = document.createElement('div'); c.className = 'g';
      const cv = document.createElement('canvas'); portrait(TACT, D.generals[r.g].look).to(cv);
      const n = document.createElement('div'); n.className = 'n'; n.textContent = D.generals[r.g].name;
      const v = document.createElement('span'); v.className = 'tag unk'; v.textContent = '…';
      c.append(cv, n, v); box.append(c);
      return v;
    });
    const tally = ov.querySelector('[data-f="tally"]'), acts = ov.querySelector('[data-f="acts"]');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0, count = 0;
    const finish = () => {
      tally.textContent = won ? `${yes} of ${vs.length} vote for you. You are Generalísimo.` : `Only ${yes} of ${vs.length} vote for you. The generals choose ${rivalName}.`;
      tally.className = 'tally ' + (won ? 'ok' : 'warn');
      sfx(won ? 'fanfare' : 'bad');
      S.end = won ? (S.flags.madrid ? 'madrid' : 'generalisimo') : 'junta';
      S.votes = `The vote: ${yes} of ${vs.length} generals chose you.`;
      S.ledger.push({ k: 'The vote at Salamanca', you: `${yes} of ${vs.length} generals voted for you.`, hist: 'On 21 and 28 September 1936 the generals named Franco Generalísimo. Cabanellas argued against it.' });
      const go = document.createElement('button');
      go.type = 'button'; go.className = 'primary'; go.dataset.key = 'enter'; go.textContent = 'SEE WHAT HAPPENS ▶';
      go.addEventListener('click', () => { ov.hidden = true; resolve(); }, { once: true });
      acts.append(go); go.focus({ preventScroll: true });
    };
    const step = () => {
      if (i >= results.length) { finish(); return; }
      const r = results[i];
      slots[i].textContent = r.forYou ? 'FRANCO' : r.g === rival ? 'HIMSELF' : rivalName.toUpperCase();
      slots[i].className = 'tag ' + (r.forYou ? 'loyal' : 'opp');
      if (r.forYou) count++;
      sfx('vote');
      tally.textContent = `For you: ${count}`;
      i++;
      setTimeout(step, reduce ? 0 : 650);
    };
    setTimeout(step, reduce ? 0 : 500);
  });
}

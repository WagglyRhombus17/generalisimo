// Mini-game: the military tribunal. Read each file, investigate up to twice, then sign.
// The consequences depend on what the prisoner actually did, which you may never learn until the end.
import { rand, snapshot, chips } from '../game/state.js';
import { applyFx } from '../game/effects.js';
import { portrait } from '../engine/sprites.js';
import { TACT } from '../engine/palettes.js';
import { renderHUD } from '../screens/hud.js';
import { sfx, overrideMusic } from '../audio/audio.js';
import { motionOn } from '../settings.js';

const PHOTO = Object.assign({}, TACT, { pbg: ['#cdbf9c', '#a8977a'], outline: '#2a2018', skin: '#d8b48c', skinD: '#a8835e' });
const OUTCOME = {
  release: { militia: { flag: { saboteur: 1 }, morale: -2 }, union: { morale: -1, loy: { queipo: -2 } }, innocent: { legit: 2 }, feud: { legit: 2 } },
  court: { militia: { terror: 5, morale: 2 }, union: { terror: 9, legit: -3 }, innocent: { terror: 12, legit: -5 }, feud: { terror: 12, legit: -5 } }
};
const TRUTH = {
  militia: '{He} had fought with the militia.',
  union: '{He} belonged to a union or party but had taken part in no violence.',
  innocent: '{He} had done nothing {he} was accused of.',
  feud: 'The accusation was a personal grudge.'
};
const pron = (c, s) => s.replace('{He}', c.she ? 'She' : 'He').replace('{he}', c.she ? 'she' : 'he');

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function tribunal(S, ctx) {
  return new Promise(resolve => {
    const T = ctx.D.tribunal;
    const pool = T.cases.slice(), files = [];
    while (files.length < 4 && pool.length) files.push(pool.splice(Math.floor(rand(S) * pool.length), 1)[0]);
    const before = snapshot(S), verdicts = [];
    let idx = 0, probes = 2, probed = false, locked = false;

    const ov = document.getElementById('ov-trib');
    ov.hidden = false;
    overrideMusic('tribunal');
    ov.innerHTML = `<div class="trib-file" data-f="file"></div>
      <div class="bev trib-side"><h3>MILITARY TRIBUNAL</h3><p class="sub" data-f="sub"></p><div class="verdicts" data-f="btns"></div><p class="note" data-f="note"></p></div>`;
    const $f = n => ov.querySelector(`[data-f="${n}"]`);
    const file = $f('file'), btns = $f('btns');

    const button = (label, key, onClick, cls = '') => {
      const b = el('button', cls, label); b.type = 'button'; if (key) b.dataset.key = key;
      b.addEventListener('click', onClick); return b;
    };

    const intro = () => {
      file.replaceChildren(el('h2', 'nm', 'Four files for your signature'), el('p', null, T.intro));
      $f('sub').textContent = 'Read each file closely. Accusations are not always what they seem.';
      $f('note').textContent = '';
      btns.replaceChildren(button('OPEN THE FIRST FILE ▶', 'enter', showCase, 'go'));
      btns.querySelector('button').focus({ preventScroll: true });
    };

    function section(label, content) {
      const box = el('div');
      box.append(el('div', 'k', label));
      if (Array.isArray(content)) { const ul = el('ul'); content.forEach(t => ul.append(el('li', null, t))); box.append(ul); }
      else box.append(content instanceof Node ? content : el('p', null, content));
      return box;
    }

    function showCase() {
      const c = files[idx];
      probed = false; locked = false;
      const head = el('div', 'head');
      const cv = document.createElement('canvas'); portrait(PHOTO, c.look).to(cv);
      const who = el('div');
      who.append(el('div', 'k', `FILE ${idx + 1} OF ${files.length}`), el('div', 'nm', c.name), el('div', 'meta', `${c.age} · ${c.job} · ${c.place}`), el('div', 'meta', `Source: ${c.accuser}`));
      head.append(cv, who);
      const inv = el('p', 'hidden', 'Not investigated.');
      inv.dataset.f = 'inv';
      file.replaceChildren(head, section('ACCUSATION', c.accusation), section('EVIDENCE', c.evidence),
        section('STATEMENT', `"${c.statement}"`), section('WITNESS', c.witness), section('INVESTIGATION', inv));
      file.scrollTop = 0;
      sfx('paper');
      renderButtons();
    }

    function renderButtons() {
      $f('sub').textContent = `Case ${idx + 1} of ${files.length}. Your signature decides it.`;
      $f('note').textContent = `Investigations left: ${probes}. Each one reveals what the file leaves out.`;
      const inv = button(`2 INVESTIGATE (${probes} left)`, '2', investigate);
      inv.disabled = probes <= 0 || probed;
      btns.replaceChildren(button('1 RELEASE', '1', () => sign('release')), inv, button('3 SEND TO COURT-MARTIAL', '3', () => sign('court')));
      btns.querySelector('button').focus({ preventScroll: true });
    }

    function investigate() {
      if (probes <= 0 || probed || locked) return;
      probes--; probed = true;
      const p = file.querySelector('[data-f="inv"]');
      p.textContent = files[idx].hidden; p.className = 'found';
      sfx('paper');
      renderButtons();
    }

    function sign(v) {
      if (locked) return;
      locked = true;
      const c = files[idx];
      applyFx(S, OUTCOME[v][c.truth]);
      verdicts.push({ c, v, probed });
      renderHUD(S, ctx.D);
      const mark = el('div', 'stamp-mark', v === 'release' ? 'RELEASED' : 'COURT-MARTIAL');
      file.append(mark);
      sfx('stamp');
      btns.querySelectorAll('button').forEach(b => { b.disabled = true; });
      setTimeout(() => { idx++; if (idx < files.length) showCase(); else summary(); }, motionOn() ? 1000 : 350);
    }

    function summary() {
      const list = el('div', 'trows');
      verdicts.forEach(({ c, v }) => {
        const row = el('div', 'trow');
        row.append(el('b', null, c.name), el('span', v === 'release' ? 'rel' : 'cm', v === 'release' ? 'Released' : 'Court-martial'), el('span', null, pron(c, TRUTH[c.truth])));
        list.append(row);
      });
      const ch = el('div', 'chips');
      chips(before, snapshot(S), S, ctx.D).forEach(x => ch.append(el('span', `chip ${x.c}`, x.t)));
      file.replaceChildren(el('h2', 'nm', 'What the files did not say'), list, ch, el('p', 'hist', T.hist));
      file.scrollTop = 0;
      const sent = verdicts.filter(x => x.v === 'court');
      const wrong = sent.filter(x => x.c.truth === 'innocent' || x.c.truth === 'feud').length;
      S.ledger.push({
        k: 'The tribunal',
        you: `You released ${verdicts.length - sent.length} and sent ${sent.length} to court-martial${wrong ? `, ${wrong} of them falsely accused` : ''}.`,
        hist: T.hist
      });
      $f('sub').textContent = 'The files are closed.';
      $f('note').textContent = '';
      const harmless = verdicts.filter(x => x.c.truth !== 'militia'), freed = harmless.filter(x => x.v === 'release').length;
      const result = {
        score: harmless.length ? Math.round(freed / harmless.length * 100) : (sent.length ? 100 : 0),
        text: harmless.length ? `You freed ${freed} of the ${harmless.length} prisoners who had harmed no one.` : 'Every prisoner in these files had fought with the militias.'
      };
      btns.replaceChildren(button('CONTINUE ▶', 'enter', () => { ov.hidden = true; overrideMusic(null); resolve(result); }, 'go'));
      btns.querySelector('button').focus({ preventScroll: true });
    }

    intro();
  });
}

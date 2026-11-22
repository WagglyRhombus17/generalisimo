// Mini-games mode: play any mini-game on its own from the title screen, with a fresh setup each time
// and a best score kept on this device.
import { airlift } from '../minigames/ju52.js';
import { tribunal } from '../minigames/tribunal.js';
import { council, vote } from '../minigames/council.js';
import { siege } from '../minigames/siege.js';
import { ironRing } from '../minigames/ironring.js';
import { ebroCrossing } from '../minigames/ebro.js';
import { drawStill } from '../scenes/index.js';
import { sfx } from '../audio/audio.js';

const BEST_KEY = 'generalisimo.arcade.v1';
const $ = s => document.querySelector(s);

// Each game: where it sits in the war, how to set up a state for it, and how to show its score.
export const GAMES = [
  {
    id: 'airlift', n: 'Load the Junkers', when: 'Chapter II · July 1936', thumb: { t: 'airfield' }, scene: { t: 'night' },
    d: 'Pack troops, guns and mules into a Ju 52 against the clock, under the weight limit and in balance.',
    setup: S => Object.assign(S, { ch: 2, day: 13, tS: 1500, tA: 20000, ger: 60, ita: 30, ammo: 40, route: ['Tetuán', 'Airlift', 'Sevilla'], pos: 1 }),
    play: (S, ctx) => airlift(S, ctx), unit: n => `${n.toLocaleString('en-US')} men flown`
  },
  {
    id: 'tribunal', n: 'The Tribunal', when: 'Chapter III · August 1936', thumb: { t: 'road', town: 'seville', sky: 'day' }, scene: { t: 'road', town: 'seville', sky: 'day' },
    d: 'Read four case files, investigate twice, and decide. The truth comes out only at the end.',
    setup: S => Object.assign(S, { ch: 3, day: 22, tS: 9000, tA: 6000, route: ['Sevilla'], pos: 0 }),
    play: (S, ctx) => tribunal(S, ctx), unit: n => `${n}% of the harmless freed`
  },
  {
    id: 'council', n: 'The Salamanca Council', when: 'Chapter IV · September 1936', thumb: { t: 'road', town: 'village', sky: 'sunset' }, scene: { t: 'road', town: 'village', sky: 'sunset' },
    d: 'Three days to win over the generals before they vote for a supreme commander.',
    setup: S => {
      Object.assign(S, { ch: 4, day: 73, tS: 14000, ger: 55, ita: 40, legit: 50, route: ['Maqueda', 'Salamanca'], pos: 1 });
      S.alive.sanjurjo = false;
      Object.assign(S.inf, { franco: 54, mola: 66, queipo: 50, cabanellas: 48, kindelan: 26, orgaz: 24, sanjurjo: 0 });
      return S;
    },
    play: async (S, ctx) => { await council(S, ctx); return vote(S, ctx); }, unit: n => `${n} vote${n === 1 ? '' : 's'}`
  },
  {
    id: 'siege', n: 'The Assault on Madrid', when: 'Chapter V · November 1936', thumb: { t: 'battle', town: 'madrid', sky: 'sunset' }, scene: { t: 'road', town: 'madrid', sky: 'sunset' },
    d: 'Three days to break into Madrid: columns, bombers, artillery and one scouting flight a day.',
    setup: S => Object.assign(S, { ch: 5, day: 114, tS: 22000, ger: 55, ita: 45, ammo: 55, morale: 62, route: ['Toledo', 'Navalcarnero', 'Madrid'], pos: 2 }),
    play: (S, ctx) => siege(S, ctx), unit: n => (n >= 100 ? 'Madrid taken' : `${n}% furthest advance`)
  },
  {
    id: 'ironring', n: 'The Iron Ring', when: 'Chapter VII · June 1937', thumb: { t: 'road', town: 'bilbao', sky: 'north' }, scene: { t: 'road', town: 'bilbao', sky: 'north' },
    d: "Memorise the stolen plans of Bilbao's fortifications, then find the weak points with four barrages.",
    setup: S => Object.assign(S, { ch: 7, day: 331, tS: 60000, ger: 60, ita: 50, ammo: 60, route: ['Vitoria', 'Biscay', 'Bilbao'], pos: 2 }),
    play: (S, ctx) => ironRing(S, ctx), unit: n => `${n} points`
  },
  {
    id: 'ebro', n: 'The Ebro', when: 'Chapter IX · July 1938', thumb: { t: 'road', town: 'river', sky: 'dawn' }, scene: { t: 'road', town: 'river', sky: 'dawn' },
    d: 'Real time. Shell and bomb the pontoon bridges, flood the river, and keep the Republic out of Gandesa.',
    setup: S => Object.assign(S, { ch: 9, day: 739, tS: 120000, ger: 65, ita: 50, ammo: 60, route: ['Castellón', 'Ebro', 'Gandesa'], pos: 1 }),
    play: (S, ctx) => ebroCrossing(S, ctx), unit: n => `${n} points`
  }
];

// The generals who have died by a mini-game's date are gone from the board.
export function setupGame(G, S) {
  G.setup(S);
  if (S.ch >= 2) { S.alive.sanjurjo = false; S.inf.sanjurjo = 0; }
  if (S.ch >= 7) { S.alive.mola = false; S.inf.mola = 0; }
  return S;
}

export function bests() { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch (e) { return {}; } }
export function recordBest(id, score) {
  const b = bests(), prev = b[id];
  const isBest = prev == null || score > prev;
  if (isBest) { b[id] = score; try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { /* storage unavailable */ } }
  return { best: isBest ? score : prev, isBest, first: prev == null };
}

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

export function showGames({ onPlay, onBack }) {
  const ov = $('#ov-title');
  ov.hidden = false;
  ov.replaceChildren();
  const p = el('div', 'games-panel bev');
  p.append(el('div', 'k', 'MINI-GAMES'), el('h2', null, 'Play any mini-game on its own'),
    el('p', 'sub', 'Each one is set up fresh every time. Your best result is kept on this device.'));
  const grid = el('div', 'games');
  const b = bests();
  GAMES.forEach((g, i) => {
    const card = button('', String(i + 1), () => { sfx('select'); onPlay(g.id); }, 'game');
    const cv = document.createElement('canvas');
    drawStill(cv, g.thumb);
    const info = el('div', 'gi');
    info.append(el('b', null, `${i + 1} ${g.n}`), el('span', 'when', g.when), el('span', 'gd', g.d),
      el('span', 'best', b[g.id] != null ? `Best: ${g.unit(b[g.id])}` : 'Not played yet'));
    card.append(cv, info);
    grid.append(card);
  });
  p.append(grid, el('div', 'menu'));
  p.lastChild.append(button('◀ BACK', 'b', onBack));
  ov.append(p);
  grid.querySelector('button').focus({ preventScroll: true });
}

export function showArcadeResult({ game, result, chips, record, onAgain, onMenu, onTitle }) {
  const ov = $('#ov-card');
  ov.hidden = false;
  ov.replaceChildren();
  const p = el('div', 'card-panel bev');
  p.append(el('div', 'k', `MINI-GAME · ${game.when.toUpperCase()}`), el('h2', null, game.n), el('p', null, result.text || ''));
  if (chips && chips.length) {
    const row = el('div', 'chips');
    chips.forEach(c => row.append(el('span', `chip ${c.c}`, c.t)));
    p.append(row);
  }
  p.append(el('p', 'score', `Result: ${game.unit(result.score)}${record.isBest && !record.first ? ' · NEW BEST!' : ''}${!record.isBest ? ` · Best: ${game.unit(record.best)}` : ''}`));
  const menu = el('div', 'menu');
  menu.append(button('PLAY AGAIN ▶', 'enter', onAgain, 'go'), button('ALL MINI-GAMES', 'b', onMenu), button('TITLE SCREEN', 't', onTitle));
  p.append(menu);
  ov.append(p);
  sfx(record.isBest ? 'fanfare' : 'stamp');
  menu.querySelector('button').focus({ preventScroll: true });
}

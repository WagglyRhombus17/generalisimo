// Interprets the effect objects used in data/events.json, and advances time.
//
// Effect keys:
//   tS, tA, ammo, funds, morale, legit, ger, ita, terror, delay   numbers to add
//   ship: n        move n men from the Army of Africa to Spain
//   inf: {id: n}   change a general's influence (franco = you)
//   loy: {id: n}   change a general's loyalty to you
//   rev: [id]      reveal a general's loyalty
//   flag: {k: v}   set story flags
//   end: id        end the game with this ending
//   roll: {p, win, lose}   random branch; each branch is an effect object with optional r (result text)
import { rand, clamp, LABEL } from './state.js';

const RANGE = {
  tS: [0, 1e6], tA: [0, 1e6], ammo: [0, 100], funds: [0, 100], morale: [0, 100],
  legit: [0, 100], ger: [0, 100], ita: [0, 100], terror: [0, 100], delay: [0, 99]
};

export function bump(S, k, n) { const [a, b] = RANGE[k]; S[k] = clamp(S[k] + n, a, b); }

export function applyFx(S, fx) {
  if (!fx) return '';
  let text = '';
  for (const k of Object.keys(fx)) {
    const v = fx[k];
    if (k === 'r') continue;
    if (k === 'inf') for (const g in v) S.inf[g] = clamp((S.inf[g] || 0) + v[g], 0, 100);
    else if (k === 'loy') for (const g in v) S.loy[g] = clamp((S.loy[g] || 0) + v[g], -100, 100);
    else if (k === 'rev') v.forEach(g => { S.rev[g] = 1; });
    else if (k === 'flag') Object.assign(S.flags, v);
    else if (k === 'end') S.end = v;
    else if (k === 'ship') { const n = Math.min(v, S.tA); S.tA -= n; S.tS += n; }
    else if (k === 'roll') {
      const br = rand(S) < v.p ? v.win : v.lose;
      if (br) text = [br.r, applyFx(S, br)].filter(Boolean).join(' ');
    } else if (k in RANGE) bump(S, k, v);
  }
  return text;
}

// Returns '' when a requirement is met, or a short reason when it is not.
export function unmet(S, req) {
  if (!req) return '';
  if (req.min) for (const k in req.min) if (S[k] < req.min[k]) return `Needs ${LABEL[k]} ${req.min[k]}+`;
  if (req.flag && !S.flags[req.flag]) return 'Not available';
  if (req.noflag && S.flags[req.noflag]) return 'Not available';
  if (req.alive && !S.alive[req.alive]) return 'Not available';
  return '';
}

// One day passes per loop: supplies run down, rivals gain ground, reinforcements cross.
export function passTime(S, days) {
  for (let i = 0; i < days; i++) {
    S.ammo = clamp(S.ammo - 1 + S.ger / 100 * 0.7 + S.ita / 100 * 0.4, 0, 100);
    S.funds = clamp(S.funds - 0.25, 0, 100);
    if (S.funds <= 0) S.morale -= 0.5;
    S.morale = clamp(S.morale + (60 - S.morale) * 0.03, 0, 100);
    S.inf.mola = clamp(S.inf.mola + 0.15, 0, 100);
    if (S.ch >= 2) S.inf.queipo = clamp(S.inf.queipo + 0.08, 0, 100);
    if (S.alive.sanjurjo && S.ch >= 2) S.inf.sanjurjo = clamp(S.inf.sanjurjo + 0.1, 0, 100);
    if (S.flags.pipe || S.flags.sea) {
      const air = S.flags.pipe ? S.ger / 100 * 80 * (S.flags.fuelShort ? 0.6 : 1) : 0;
      const n = Math.min(S.tA, Math.round(air + (S.flags.sea ? 110 : 0)));
      S.tA -= n; S.tS += n;
    }
  }
  S.day += days;
}

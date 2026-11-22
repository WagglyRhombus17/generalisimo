// Game state: creation, seeded randomness, dates, save/load, and before/after comparisons.

const SAVE_KEY = 'generalisimo.save.v1';

export function newState(seed, D) {
  const inf = {}, loy = {};
  for (const [id, g] of Object.entries(D.generals)) { inf[id] = g.inf; loy[id] = g.loy; }
  return {
    v: 1, seed, r: (seed >>> 0) || 1, pc: 0, ch: 1, day: 0, delay: 0,
    tS: 0, tA: 0, ammo: 55, funds: 40, morale: 65, legit: 40, ger: 0, ita: 0, terror: 0,
    inf, loy, rev: { franco: 1, kindelan: 1, orgaz: 1 }, alive: { sanjurjo: true },
    flags: {}, used: [], ledger: [], notes: {}, route: [], pos: 0, trail: [], scene: null, end: null, rival: null, votes: null
  };
}

export const randomSeed = () => 1000 + Math.floor(Math.random() * 9000);

// All game randomness goes through this, so a seed always replays the same way.
export function rand(S) {
  S.r = (Math.imul(S.r, 1664525) + 1013904223) >>> 0;
  return S.r / 4294967296;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function fmtDate(day) {
  const d = new Date(1936, 6, 16 + Math.round(day));
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(day) {
  const d = new Date(1936, 6, 16 + Math.round(day));
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
// Event titles carry their historical date; if you are running early or late, show your actual date instead.
export const datedTitle = (title, day) => title.replace(/\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) 193\d/, longDate(day));

export function save(S) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
export function load() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ } }

export const LABEL = {
  tS: 'Army in Spain', tA: 'Army in Africa', ammo: 'Ammo', funds: 'Funds', morale: 'Morale',
  legit: 'Legitimacy', ger: 'Germany', ita: 'Italy', terror: 'Terror', delay: 'Delay (days)'
};
const BAD_WHEN_UP = { terror: 1, delay: 1 };
const ORDER = ['tS', 'tA', 'ammo', 'funds', 'morale', 'legit', 'ger', 'ita', 'terror', 'delay'];

export function snapshot(S) {
  const o = { inf: { ...S.inf }, loy: { ...S.loy } };
  ORDER.forEach(k => { o[k] = S[k]; });
  return o;
}

// Turn the difference between two snapshots into labelled chips for the result screen.
export function chips(a, b, S, D) {
  const out = [];
  const sign = n => (n > 0 ? '+' : '−') + Math.abs(n).toLocaleString('en-US');
  for (const k of ORDER) {
    const d = Math.round(b[k] - a[k]);
    if (!d) continue;
    const bad = BAD_WHEN_UP[k] ? d > 0 : d < 0;
    out.push({ t: `${LABEL[k]} ${sign(d)}`, c: bad ? 'bad' : 'good' });
  }
  for (const g of Object.keys(b.inf)) {
    const d = Math.round(b.inf[g] - a.inf[g]);
    if (!d) continue;
    if (g === 'franco') out.push({ t: `Your influence ${sign(d)}`, c: d > 0 ? 'good' : 'bad' });
    else out.push({ t: `${D.generals[g].name} influence ${sign(d)}`, c: d > 0 ? 'bad' : 'good' });
  }
  for (const g of Object.keys(b.loy)) {
    const d = Math.round(b.loy[g] - a.loy[g]);
    if (!d || g === 'franco') continue;
    if (S.rev[g]) out.push({ t: `${D.generals[g].name} loyalty ${sign(d)}`, c: d > 0 ? 'good' : 'bad' });
    else out.push({ t: `${D.generals[g].name}'s mood shifts`, c: 'neu' });
  }
  return out;
}
